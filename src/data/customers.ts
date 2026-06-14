/**
 * Customer (Airship contact) sample data + the helpers behind the CRM-style
 * actions. These are a different entity from enquiries: real people with a
 * birthday, a visit history (Proof of Presence) and a feedback trail. The
 * Actions inbox derives proactive, segment-style actions from them — distinct
 * from the enquiry-pipeline tasks.
 *
 * In production these come from Airship groups/segments via the adapter; held
 * as fixtures here so the rules are demonstrable with zero config.
 */

export type Sentiment = "positive" | "neutral" | "negative";

export interface Feedback {
  date: string; // ISO (YYYY-MM-DD)
  sentiment: Sentiment;
  score?: number; // 1–5
  comment?: string;
}

/** A dynamic Airship segment a contact can belong to. */
export interface Segment {
  id: string;
  name: string;
  description: string;
}

/** A contact's membership of a segment, with when they entered it. */
export interface SegmentMembership {
  id: string;
  /** When the contact entered the segment (YYYY-MM-DD). */
  since: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  /** YYYY-MM-DD */
  dateOfBirth: string;
  /** Visit dates (Proof of Presence), YYYY-MM-DD. */
  visits: string[];
  /** Feedback trail, any order (sorted by date in the rules). */
  feedback: Feedback[];
  /** Lifetime spend, £. */
  totalSpend: number;
  /** Current Airship segment memberships. */
  segments?: SegmentMembership[];
}

/** The catalogue of segments the workspace can watch. */
export const DEFAULT_SEGMENTS: Segment[] = [
  { id: "seg-vip", name: "VIP / High Value", description: "Top 5% by lifetime spend" },
  { id: "seg-lapsed", name: "Lapsed 90+ days", description: "No visit in over 90 days" },
  { id: "seg-new-signup", name: "New Sign-ups (30d)", description: "Joined the database in the last 30 days" },
  { id: "seg-promoters", name: "Feedback Promoters", description: "Recently left positive feedback" },
];

/** Segments that trigger an inbox action on entry, by default. */
export const DEFAULT_WATCHED_SEGMENTS = ["seg-lapsed"];

// "Today" in the prototype is 2026-06-13, so birthdays/visits below are dated
// relative to that to make the rules fire visibly.
export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "CUST-001",
    firstName: "Eleanor", lastName: "Whitfield",
    email: "eleanor.whitfield@gmail.com", phone: "07700300101",
    dateOfBirth: "1985-06-20",
    visits: ["2023-06-18", "2024-06-25", "2025-06-15", "2025-12-20"],
    feedback: [{ date: "2025-06-15", sentiment: "positive", score: 5, comment: "Wonderful birthday meal" }],
    totalSpend: 2480,
    segments: [{ id: "seg-vip", since: "2026-06-08" }],
  },
  {
    id: "CUST-002",
    firstName: "Raj", lastName: "Patel",
    email: "raj.patel@workmail.com", phone: "07700300102",
    dateOfBirth: "1991-07-02",
    visits: ["2024-07-05", "2025-06-28", "2025-02-14"],
    feedback: [{ date: "2025-06-28", sentiment: "neutral", score: 3 }],
    totalSpend: 1760,
    segments: [{ id: "seg-new-signup", since: "2026-06-11" }],
  },
  {
    id: "CUST-003",
    firstName: "Sofia", lastName: "Romano",
    email: "sofia.romano@gmail.com", phone: "07700300103",
    dateOfBirth: "1979-06-26",
    visits: ["2023-07-02", "2024-11-10"],
    feedback: [],
    totalSpend: 980,
  },
  {
    id: "CUST-004",
    firstName: "Grace", lastName: "Liu",
    email: "grace.liu@gmail.com", phone: "07700300104",
    dateOfBirth: "1996-06-24",
    // Birthday is near, but no visits around it — should NOT trigger a birthday action.
    visits: ["2024-02-10", "2025-09-01"],
    feedback: [],
    totalSpend: 540,
    segments: [{ id: "seg-lapsed", since: "2026-06-09" }],
  },
  {
    id: "CUST-005",
    firstName: "Tom", lastName: "Bishop",
    email: "tom.bishop@gmail.com", phone: "07700300105",
    // Birthday far off — should NOT trigger a birthday action.
    dateOfBirth: "1980-11-12",
    visits: ["2024-11-10", "2025-11-08"],
    feedback: [{ date: "2025-11-08", sentiment: "positive", score: 4 }],
    totalSpend: 1320,
    segments: [{ id: "seg-lapsed", since: "2026-05-20" }],
  },
  {
    id: "CUST-006",
    firstName: "Daniel", lastName: "Okafor",
    email: "daniel.okafor@gmail.com", phone: "07700300106",
    dateOfBirth: "1988-03-15",
    visits: ["2024-08-10", "2025-03-02", "2026-05-25"],
    feedback: [
      { date: "2024-08-10", sentiment: "positive", score: 5, comment: "First-class service" },
      { date: "2025-03-02", sentiment: "positive", score: 4, comment: "Great again" },
      { date: "2026-05-25", sentiment: "negative", score: 2, comment: "Long wait, food arrived cold" },
    ],
    totalSpend: 3120,
  },
  {
    id: "CUST-007",
    firstName: "Hannah", lastName: "Kelly",
    email: "hannah.kelly@gmail.com", phone: "07700300107",
    dateOfBirth: "1993-09-30",
    visits: ["2023-12-05", "2026-06-02"],
    feedback: [
      { date: "2023-12-05", sentiment: "positive", score: 5, comment: "Lovely evening, will return" },
      { date: "2026-06-02", sentiment: "negative", score: 2, comment: "Booking mix-up and no apology" },
    ],
    totalSpend: 1450,
  },
  {
    id: "CUST-008",
    firstName: "Mark", lastName: "Reeves",
    email: "mark.reeves@gmail.com", phone: "07700300108",
    dateOfBirth: "1975-04-18",
    // Negative THEN positive (recovered) — should NOT trigger sentiment action.
    visits: ["2025-01-20", "2026-04-12"],
    feedback: [
      { date: "2025-01-20", sentiment: "negative", score: 2, comment: "Disappointing" },
      { date: "2026-04-12", sentiment: "positive", score: 5, comment: "Much improved, thank you" },
    ],
    totalSpend: 870,
  },
  {
    id: "CUST-009",
    firstName: "Nina", lastName: "Schmidt",
    email: "nina.schmidt@gmail.com", phone: "07700300109",
    dateOfBirth: "1990-10-05",
    // Only negative, no prior positive — not a downgrade.
    visits: ["2026-05-30"],
    feedback: [{ date: "2026-05-30", sentiment: "negative", score: 2, comment: "Overpriced" }],
    totalSpend: 210,
  },
];

/**
 * Contacts this workspace tracks. Airship has no "list all contacts" endpoint —
 * you look contacts up individually (Search Contact) — so in live mode we enrich
 * this set one by one. In production this list comes from our own record of
 * contacts captured via forms/journeys; here the sample emails stand in.
 */
export const TRACKED_CONTACT_EMAILS = MOCK_CUSTOMERS.map((c) => c.email);

// ---- Date helpers (TZ-free day arithmetic) ----

const dayNum = (y: number, m: number, d: number) => Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
const parseYMD = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
};
const todayNum = (now: Date) => dayNum(now.getFullYear(), now.getMonth() + 1, now.getDate());

export interface BirthdayInfo {
  /** Days until the next birthday. */
  days: number;
  /** Age the customer will turn. */
  age: number;
  /** How many of the last 3 years they visited within ±`windowDays`. */
  yearsVisitedNear: number;
}

/** Next-birthday timing + the historical visit pattern around it. */
export function birthdayInfo(c: Customer, now: Date, windowDays = 14, years = 3): BirthdayInfo {
  const { y: birthYear, m, d } = parseYMD(c.dateOfBirth);
  const today = todayNum(now);

  let by = now.getFullYear();
  let bn = dayNum(by, m, d);
  if (bn < today) {
    by += 1;
    bn = dayNum(by, m, d);
  }

  let yearsVisitedNear = 0;
  for (let i = 1; i <= years; i++) {
    const yr = now.getFullYear() - i;
    const bdayN = dayNum(yr, m, d);
    const hit = c.visits.some((v) => {
      const p = parseYMD(v);
      return Math.abs(dayNum(p.y, p.m, p.d) - bdayN) <= windowDays;
    });
    if (hit) yearsVisitedNear += 1;
  }

  return { days: bn - today, age: by - birthYear, yearsVisitedNear };
}

export interface SentimentFlip {
  priorPositive: Feedback;
  latestNegative: Feedback;
}

/** Detect a positive→negative sentiment downgrade (latest feedback negative,
 *  with an earlier positive on record). */
export function sentimentFlip(c: Customer): SentimentFlip | null {
  if (c.feedback.length < 2) return null;
  const sorted = [...c.feedback].sort(
    (a, b) => dayNumFromStr(a.date) - dayNumFromStr(b.date)
  );
  const latest = sorted[sorted.length - 1];
  if (latest.sentiment !== "negative") return null;
  const priorPositive = sorted.slice(0, -1).reverse().find((f) => f.sentiment === "positive");
  if (!priorPositive) return null;
  return { priorPositive, latestNegative: latest };
}

const dayNumFromStr = (s: string) => {
  const { y, m, d } = parseYMD(s);
  return dayNum(y, m, d);
};

export const lastVisitDate = (c: Customer): string | null =>
  c.visits.length ? [...c.visits].sort().at(-1)! : null;
