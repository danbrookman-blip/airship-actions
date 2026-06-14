/**
 * Agentic task engine.
 *
 * The platform watches the enquiry set and *derives* the actions a human needs
 * to take — it pushes these back into the Inbox rather than waiting to be asked.
 * Everything is computed from enquiry timestamps + stage, so the rules run the
 * same whether data comes from sample fixtures or a live Airship group.
 *
 * Thresholds live in one CONFIG block so the SLA policy is tunable in one place
 * (same adapter discipline as the airship-scv project).
 */

import { EVENT_TYPE_LABELS, type Enquiry } from "@/data/mockData";
import { stageMeta, type Stage, type StageFlags } from "@/lib/stages";

/** Tunable SLA / escalation policy. Hours unless stated. */
export const TASK_CONFIG = {
  firstResponseHours: 24, // a "new" enquiry must get a response within this
  followUpDueWithinHours: 24, // a scheduled follow-up is "due soon" inside this
  depositChaseAfterHours: 48, // deposit requested but unpaid for this long → chase
  depositOverdueAfterHours: 120, // ...and overdue past this (5 days)
  eventApproachingDays: 7, // event this close but not confirmed → flag
};

export type TaskSeverity = "overdue" | "due_soon" | "attention";

export type TaskKind =
  | "sla_first_response"
  | "follow_up_overdue"
  | "follow_up_due"
  | "unassigned"
  | "deposit_chase"
  | "event_approaching";

export interface ActionTask {
  id: string;
  enquiryId: string;
  kind: TaskKind;
  severity: TaskSeverity;
  /** Imperative, e.g. "Respond to new enquiry". */
  title: string;
  /** Human-readable why-this-surfaced line. */
  reason: string;
  /** ISO timestamp this action is/was due. */
  dueAt: string;
  /** Hours since due (positive = overdue) — used for sorting. */
  overdueHours: number;
}

const SEVERITY_RANK: Record<TaskSeverity, number> = {
  overdue: 0,
  due_soon: 1,
  attention: 2,
};

const hoursBetween = (from: string | Date, to: string | Date) =>
  (new Date(to).getTime() - new Date(from).getTime()) / 36e5;

const fullName = (e: Enquiry) => `${e.firstName} ${e.lastName}`;

const fmtAge = (hours: number) => {
  const h = Math.abs(Math.round(hours));
  if (h < 48) return `${h}h`;
  return `${Math.round(h / 24)}d`;
};

/**
 * Derive every outstanding action for a single enquiry at time `now`.
 * Pure function — no side effects, no clock reads beyond the passed-in `now`.
 */
export function deriveTasksForEnquiry(
  e: Enquiry,
  meta: Map<string, StageFlags>,
  now: Date
): ActionTask[] {
  const tasks: ActionTask[] = [];
  const flags = meta.get(e.stage);
  if (flags?.isTerminal) return tasks; // lost / cancelled / completed: nothing to chase

  // 1. First-response on brand-new enquiries: visible the moment it arrives,
  //    escalating from "attention" to "overdue" once the SLA window passes.
  if (flags?.isEntry) {
    const age = hoursBetween(e.createdAt, now);
    const via = e.airshipGroup ? ` via ${e.airshipGroup}` : "";
    const dueAt = new Date(
      new Date(e.createdAt).getTime() + TASK_CONFIG.firstResponseHours * 36e5
    ).toISOString();
    if (age >= TASK_CONFIG.firstResponseHours) {
      tasks.push({
        id: `${e.id}-sla`,
        enquiryId: e.id,
        kind: "sla_first_response",
        severity: "overdue",
        title: "Respond to new enquiry",
        reason: `No response for ${fmtAge(age)} — first-response SLA is ${TASK_CONFIG.firstResponseHours}h.`,
        dueAt,
        overdueHours: age - TASK_CONFIG.firstResponseHours,
      });
    } else {
      tasks.push({
        id: `${e.id}-sla`,
        enquiryId: e.id,
        kind: "sla_first_response",
        severity: "attention",
        title: "New enquiry — first response due",
        reason: `Arrived${via} ${age < 1 ? "just now" : `${fmtAge(age)} ago`}. Respond within ${Math.max(1, Math.round(TASK_CONFIG.firstResponseHours - age))}h.`,
        dueAt,
        overdueHours: age - TASK_CONFIG.firstResponseHours,
      });
    }
  }

  // 2. Scheduled follow-up — overdue or due soon.
  if (e.nextFollowUp) {
    const hrsUntil = hoursBetween(now.toISOString(), e.nextFollowUp);
    if (hrsUntil < 0) {
      tasks.push({
        id: `${e.id}-followup`,
        enquiryId: e.id,
        kind: "follow_up_overdue",
        severity: "overdue",
        title: "Follow-up overdue",
        reason: -hrsUntil < 1 ? "Follow-up is due now." : `Follow-up was due ${fmtAge(hrsUntil)} ago.`,
        dueAt: e.nextFollowUp,
        overdueHours: -hrsUntil,
      });
    } else if (hrsUntil <= TASK_CONFIG.followUpDueWithinHours) {
      tasks.push({
        id: `${e.id}-followup`,
        enquiryId: e.id,
        kind: "follow_up_due",
        severity: "due_soon",
        title: "Follow-up due",
        reason: `Follow-up due in ${fmtAge(hrsUntil)}.`,
        dueAt: e.nextFollowUp,
        overdueHours: -hrsUntil,
      });
    }
  }

  // 3. Unassigned but past the entry stage — someone picked it up but never owned it.
  if (!e.assignedTo && !flags?.isEntry) {
    tasks.push({
      id: `${e.id}-assign`,
      enquiryId: e.id,
      kind: "unassigned",
      severity: "attention",
      title: "Assign an owner",
      reason: "Active enquiry has no assigned owner.",
      dueAt: e.updatedAt,
      overdueHours: hoursBetween(e.updatedAt, now),
    });
  }

  // 4. Deposit requested but not paid, ageing.
  if (e.depositStatus === "requested") {
    const age = hoursBetween(e.updatedAt, now);
    if (age >= TASK_CONFIG.depositChaseAfterHours) {
      const overdue = age >= TASK_CONFIG.depositOverdueAfterHours;
      tasks.push({
        id: `${e.id}-deposit`,
        enquiryId: e.id,
        kind: "deposit_chase",
        severity: overdue ? "overdue" : "due_soon",
        title: "Chase deposit",
        reason: `Deposit${e.depositAmount ? ` of £${e.depositAmount.toLocaleString()}` : ""} requested ${fmtAge(age)} ago, still unpaid.`,
        dueAt: e.updatedAt,
        overdueHours: age - TASK_CONFIG.depositChaseAfterHours,
      });
    }
  }

  // 5. Event approaching while not yet confirmed.
  const daysToEvent = hoursBetween(now.toISOString(), e.requestedDate) / 24;
  const lockedIn = !!flags?.isWon;
  if (daysToEvent >= 0 && daysToEvent <= TASK_CONFIG.eventApproachingDays && !lockedIn) {
    tasks.push({
      id: `${e.id}-event`,
      enquiryId: e.id,
      kind: "event_approaching",
      severity: "due_soon",
      title: "Confirm before event date",
      reason: `${EVENT_TYPE_LABELS[e.eventType]} for ${fullName(e)} is in ${Math.round(daysToEvent)}d but not yet confirmed.`,
      dueAt: e.requestedDate,
      overdueHours: 0,
    });
  }

  return tasks;
}

/** Derive tasks across the whole enquiry set, sorted most-urgent first. */
export function deriveAllTasks(
  enquiries: Enquiry[],
  stages: Stage[],
  now: Date = new Date()
): ActionTask[] {
  const meta = stageMeta(stages);
  return enquiries
    .flatMap((e) => deriveTasksForEnquiry(e, meta, now))
    .sort(
      (a, b) =>
        SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
        b.overdueHours - a.overdueHours
    );
}

export interface TaskBuckets {
  overdue: ActionTask[];
  dueSoon: ActionTask[];
  attention: ActionTask[];
}

/** Group derived tasks into the Inbox's urgency lanes. */
export function bucketTasks(tasks: ActionTask[]): TaskBuckets {
  return {
    overdue: tasks.filter((t) => t.severity === "overdue"),
    dueSoon: tasks.filter((t) => t.severity === "due_soon"),
    attention: tasks.filter((t) => t.severity === "attention"),
  };
}
