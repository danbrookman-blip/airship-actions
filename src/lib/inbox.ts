/**
 * The unified Actions inbox.
 *
 * The platform surfaces two families of action into one queue:
 *   1. Enquiry-pipeline tasks (SLA, follow-ups, deposits) — see tasks.ts.
 *   2. CRM / segment-triggered actions on customers — birthdays with a visit
 *      history, and sentiment downgrades.
 *
 * Both are normalised into a single `InboxAction` shape so the Inbox renders
 * one consistent list. Adding a new action family later = one more builder here.
 */

import { EVENT_TYPE_LABELS, type Enquiry } from "@/data/mockData";
import { stageLabel, type Stage } from "@/lib/stages";
import { deriveAllTasks } from "@/lib/tasks";
import {
  birthdayInfo,
  sentimentFlip,
  lastVisitDate,
  type Customer,
  type Segment,
} from "@/data/customers";
import { airshipContactUrl } from "@/lib/airshipLinks";

export type ActionSeverity = "overdue" | "due_soon" | "attention";
export type ActionTone = "danger" | "warning" | "info" | "success" | "brand";

export interface InboxAction {
  id: string;
  severity: ActionSeverity;
  /** Drives the row icon. */
  kind: string;
  title: string;
  reason: string;
  subjectName: string;
  subjectMeta: string;
  initials: string;
  value?: number; // £
  dueAt?: string; // ISO
  /** Short chip label + tone (independent of the lane). */
  tag: string;
  tagTone: ActionTone;
  /** Route to open, if any (enquiry actions). */
  link?: string;
  /** Fallback hint (toast) when there's no link (customer actions). */
  hint?: string;
  /** Higher = more urgent within its lane. */
  sortKey: number;
}

/** Birthdays surface this far ahead (the "coming up" window). */
const BIRTHDAY_LOOKAHEAD_DAYS = 30;

const SEVERITY_LABEL: Record<ActionSeverity, string> = {
  overdue: "Overdue",
  due_soon: "Due soon",
  attention: "Needs attention",
};
const SEVERITY_TONE: Record<ActionSeverity, ActionTone> = {
  overdue: "danger",
  due_soon: "warning",
  attention: "info",
};

const initialsOf = (first: string, last: string) => `${first[0] ?? ""}${last[0] ?? ""}`;
const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

// ---- Enquiry-pipeline tasks → InboxAction ----

function enquiryActions(enquiries: Enquiry[], stages: Stage[], now: Date): InboxAction[] {
  const byId = new Map(enquiries.map((e) => [e.id, e]));
  return deriveAllTasks(enquiries, stages, now)
    .map((t): InboxAction | null => {
      const e = byId.get(t.enquiryId);
      if (!e) return null;
      return {
        id: t.id,
        severity: t.severity,
        kind: t.kind,
        title: t.title,
        reason: t.reason,
        subjectName: `${e.firstName} ${e.lastName}`,
        subjectMeta: `${EVENT_TYPE_LABELS[e.eventType]} · ${stageLabel(stages, e.stage)}`,
        initials: initialsOf(e.firstName, e.lastName),
        value: e.estimatedValue,
        dueAt: t.dueAt,
        tag: SEVERITY_LABEL[t.severity],
        tagTone: SEVERITY_TONE[t.severity],
        link: `/enquiry/${e.id}`,
        sortKey: t.overdueHours,
      };
    })
    .filter((a): a is InboxAction => a !== null);
}

// ---- Customer CRM actions ----

function birthdayActions(customers: Customer[], now: Date): InboxAction[] {
  const out: InboxAction[] = [];
  for (const c of customers) {
    const info = birthdayInfo(c, now);
    if (info.days > BIRTHDAY_LOOKAHEAD_DAYS || info.yearsVisitedNear < 1) continue;
    const last = lastVisitDate(c);
    const dueAt = new Date(now.getTime() + info.days * 86_400_000).toISOString();
    out.push({
      id: `cust-${c.id}-birthday`,
      severity: info.days <= 7 ? "due_soon" : "attention",
      kind: "birthday_visit",
      title: "Birthday coming up",
      reason: `Turns ${info.age} in ${info.days}d · visited near their birthday in ${info.yearsVisitedNear} of the last 3 years.`,
      subjectName: `${c.firstName} ${c.lastName}`,
      subjectMeta: `${last ? `Last visit ${monthYear(last)} · ` : ""}£${c.totalSpend.toLocaleString()} lifetime`,
      initials: initialsOf(c.firstName, c.lastName),
      value: c.totalSpend,
      dueAt,
      tag: "Birthday",
      tagTone: "brand",
      link: airshipContactUrl(c.id),
      hint: `Send ${c.firstName} a birthday offer or invite back.`,
      sortKey: info.yearsVisitedNear * 100 + (BIRTHDAY_LOOKAHEAD_DAYS - info.days),
    });
  }
  return out;
}

function sentimentActions(customers: Customer[]): InboxAction[] {
  const out: InboxAction[] = [];
  for (const c of customers) {
    const flip = sentimentFlip(c);
    if (!flip) continue;
    const last = lastVisitDate(c);
    out.push({
      id: `cust-${c.id}-sentiment`,
      severity: "overdue",
      kind: "sentiment_downgrade",
      title: "Sentiment dropped — win back",
      reason: `Was positive (${monthYear(flip.priorPositive.date)}${flip.priorPositive.score ? `, ${flip.priorPositive.score}/5` : ""}), latest feedback negative${flip.latestNegative.comment ? `: “${flip.latestNegative.comment}”` : ""}.`,
      subjectName: `${c.firstName} ${c.lastName}`,
      subjectMeta: `${last ? `Last visit ${monthYear(last)} · ` : ""}£${c.totalSpend.toLocaleString()} lifetime`,
      initials: initialsOf(c.firstName, c.lastName),
      value: c.totalSpend,
      dueAt: flip.latestNegative.date,
      tag: "At risk",
      tagTone: "danger",
      link: airshipContactUrl(c.id),
      hint: `Reach out to ${c.firstName} to make it right.`,
      sortKey: 10_000 + c.totalSpend, // churn risk floats to the top of the lane
    });
  }
  return out;
}

function segmentActions(
  customers: Customer[],
  watchedSegments: string[],
  catalog: Segment[],
  now: Date
): InboxAction[] {
  if (!watchedSegments.length) return [];
  const watched = new Set(watchedSegments);
  const nameOf = new Map(catalog.map((s) => [s.id, s.name]));
  const out: InboxAction[] = [];

  for (const c of customers) {
    for (const m of c.segments ?? []) {
      if (!watched.has(m.id)) continue;
      const name = nameOf.get(m.id) ?? m.id;
      const daysSince = m.since
        ? Math.max(0, Math.round((now.getTime() - new Date(m.since).getTime()) / 86_400_000))
        : null;
      const last = lastVisitDate(c);
      out.push({
        id: `cust-${c.id}-seg-${m.id}`,
        severity: daysSince != null && daysSince <= 7 ? "due_soon" : "attention",
        kind: "segment_entry",
        title: `Entered ${name}`,
        reason:
          daysSince != null
            ? `Joined the “${name}” segment ${daysSince === 0 ? "today" : `${daysSince}d ago`}.`
            : `Now in the “${name}” segment.`,
        subjectName: `${c.firstName} ${c.lastName}`,
        subjectMeta: `${last ? `Last visit ${monthYear(last)} · ` : ""}£${c.totalSpend.toLocaleString()} lifetime`,
        initials: initialsOf(c.firstName, c.lastName),
        value: c.totalSpend,
        dueAt: m.since || undefined,
        tag: "Segment",
        tagTone: "info",
        link: airshipContactUrl(c.id),
        hint: `Follow up with ${c.firstName} — now in “${name}”.`,
        sortKey: 100 - (daysSince ?? 30),
      });
    }
  }
  return out;
}

/** Build the full, normalised action list for the inbox. */
export function buildInboxActions(
  enquiries: Enquiry[],
  stages: Stage[],
  customers: Customer[],
  watchedSegments: string[],
  segments: Segment[],
  now: Date = new Date()
): InboxAction[] {
  return [
    ...enquiryActions(enquiries, stages, now),
    ...birthdayActions(customers, now),
    ...sentimentActions(customers),
    ...segmentActions(customers, watchedSegments, segments, now),
  ];
}

export interface ActionBuckets {
  overdue: InboxAction[];
  dueSoon: InboxAction[];
  attention: InboxAction[];
}

export function bucketActions(actions: InboxAction[]): ActionBuckets {
  const lane = (sev: ActionSeverity) =>
    actions.filter((a) => a.severity === sev).sort((a, b) => b.sortKey - a.sortKey);
  return { overdue: lane("overdue"), dueSoon: lane("due_soon"), attention: lane("attention") };
}
