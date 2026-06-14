/**
 * Reporting analytics — all derived from the live store (enquiries + the
 * user-defined stages), so the Dashboard and Reporting pages reflect real-time
 * state: drags, new submissions, custom/renamed stages, etc. No static fixtures.
 */

import { SOURCE_LABELS, type Enquiry } from "@/data/mockData";
import { activeStages, stageMeta, type Stage } from "@/lib/stages";

export const fmtGBP = (v: number) => `£${Math.round(v).toLocaleString()}`;

export interface DashboardStats {
  enquiriesToday: number;
  enquiriesThisWeek: number;
  enquiriesThisMonth: number;
  openPipelineValue: number;
  confirmedValue: number;
  conversionRate: number;
  activeCount: number;
  depositOutstanding: number;
  totalEnquiries: number;
  avgBookingValue: number;
}

export function dashboardStats(enquiries: Enquiry[], stages: Stage[]): DashboardStats {
  const meta = stageMeta(stages);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startWeek = startToday - 6 * 864e5;
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let enquiriesToday = 0, enquiriesThisWeek = 0, enquiriesThisMonth = 0;
  let openPipelineValue = 0, confirmedValue = 0, converted = 0, depositOutstanding = 0, activeCount = 0;

  for (const e of enquiries) {
    const c = new Date(e.createdAt).getTime();
    if (c >= startToday) enquiriesToday++;
    if (c >= startWeek) enquiriesThisWeek++;
    if (c >= startMonth) enquiriesThisMonth++;

    const f = meta.get(e.stage);
    if (f?.isWon) {
      confirmedValue += e.estimatedValue;
      converted++;
    }
    if (!f?.isTerminal) {
      openPipelineValue += e.estimatedValue;
      activeCount++;
    }
    if (e.depositStatus === "requested" && e.depositAmount) depositOutstanding += e.depositAmount;
  }

  const total = enquiries.length;
  return {
    enquiriesToday,
    enquiriesThisWeek,
    enquiriesThisMonth,
    openPipelineValue,
    confirmedValue,
    conversionRate: total ? Math.round((converted / total) * 100) : 0,
    activeCount,
    depositOutstanding,
    totalEnquiries: total,
    avgBookingValue: converted ? Math.round(confirmedValue / converted) : 0,
  };
}

export interface FunnelRow {
  name: string;
  color: string;
  count: number;
  value: number;
}

/** Funnel across the active (non-terminal) user-defined stages. */
export function funnel(enquiries: Enquiry[], stages: Stage[]): FunnelRow[] {
  return activeStages(stages).map((s) => {
    const inStage = enquiries.filter((e) => e.stage === s.id);
    return {
      name: s.label,
      color: s.color,
      count: inStage.length,
      value: inStage.reduce((a, e) => a + e.estimatedValue, 0),
    };
  });
}

export interface SourceRow { source: string; count: number; value: number; }

export function bySource(enquiries: Enquiry[]): SourceRow[] {
  const m = new Map<string, SourceRow>();
  for (const e of enquiries) {
    const source = SOURCE_LABELS[e.source] ?? e.source;
    const r = m.get(source) ?? { source, count: 0, value: 0 };
    r.count++;
    r.value += e.estimatedValue;
    m.set(source, r);
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}

export interface VenueRow { venue: string; count: number; value: number; }

export function byVenue(enquiries: Enquiry[]): VenueRow[] {
  const m = new Map<string, VenueRow>();
  for (const e of enquiries) {
    const r = m.get(e.venue) ?? { venue: e.venue, count: 0, value: 0 };
    r.count++;
    r.value += e.estimatedValue;
    m.set(e.venue, r);
  }
  return [...m.values()].sort((a, b) => b.value - a.value);
}

export interface LeaderRow {
  user: string;
  enquiries: number;
  value: number;
  converted: number;
  conversionRate: number;
}

export function leaderboard(enquiries: Enquiry[], stages: Stage[]): LeaderRow[] {
  const meta = stageMeta(stages);
  const m = new Map<string, Omit<LeaderRow, "conversionRate">>();
  for (const e of enquiries) {
    if (!e.assignedTo) continue;
    const r = m.get(e.assignedTo) ?? { user: e.assignedTo, enquiries: 0, value: 0, converted: 0 };
    r.enquiries++;
    r.value += e.estimatedValue;
    if (meta.get(e.stage)?.isWon) r.converted++;
    m.set(e.assignedTo, r);
  }
  return [...m.values()]
    .map((r) => ({ ...r, conversionRate: r.enquiries ? Math.round((r.converted / r.enquiries) * 100) : 0 }))
    .sort((a, b) => b.value - a.value);
}

export interface MonthRow { month: string; confirmed: number; pipeline: number; }

/** Booked revenue by event month — a forward window (last month → +4) since
 *  events are future-dated. Confirmed = won value; pipeline = open value. */
export function monthlyRevenue(enquiries: Enquiry[], stages: Stage[]): MonthRow[] {
  const meta = stageMeta(stages);
  const now = new Date();
  const months = [] as Array<MonthRow & { key: string }>;
  for (let i = -1; i <= 4; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: d.toLocaleString("en-GB", { month: "short" }),
      confirmed: 0,
      pipeline: 0,
    });
  }
  const idx = new Map(months.map((m, i) => [m.key, i]));
  for (const e of enquiries) {
    const d = new Date(e.requestedDate);
    const i = idx.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (i == null) continue;
    const f = meta.get(e.stage);
    if (f?.isWon) months[i].confirmed += e.estimatedValue;
    else if (!f?.isTerminal) months[i].pipeline += e.estimatedValue;
  }
  return months.map(({ month, confirmed, pipeline }) => ({ month, confirmed, pipeline }));
}
