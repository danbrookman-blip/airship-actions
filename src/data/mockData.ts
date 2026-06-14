export type PipelineStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "followup"
  | "provisional"
  | "deposit_requested"
  | "deposit_paid"
  | "confirmed"
  | "lost"
  | "cancelled"
  | "completed";

export const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string; probability: number }> = {
  new: { label: "New Enquiry", color: "bg-stage-new", probability: 10 },
  contacted: { label: "Contact Attempted", color: "bg-stage-contacted", probability: 20 },
  qualified: { label: "Qualified", color: "bg-stage-qualified", probability: 35 },
  proposal: { label: "Menu / Proposal Sent", color: "bg-stage-proposal", probability: 50 },
  followup: { label: "Follow-up Due", color: "bg-stage-followup", probability: 55 },
  provisional: { label: "Provisional Hold", color: "bg-stage-provisional", probability: 70 },
  deposit_requested: { label: "Deposit Requested", color: "bg-stage-deposit-req", probability: 80 },
  deposit_paid: { label: "Deposit Paid", color: "bg-stage-deposit-paid", probability: 90 },
  confirmed: { label: "Confirmed", color: "bg-stage-confirmed", probability: 100 },
  lost: { label: "Lost", color: "bg-stage-lost", probability: 0 },
  cancelled: { label: "Cancelled", color: "bg-stage-cancelled", probability: 0 },
  completed: { label: "Completed", color: "bg-stage-completed", probability: 100 },
};

export const ACTIVE_PIPELINE_STAGES: PipelineStage[] = [
  "new", "contacted", "qualified", "proposal", "followup",
  "provisional", "deposit_requested", "deposit_paid", "confirmed",
];

export type EventType = "birthday" | "wedding" | "private_dining" | "christmas" | "corporate" | "celebration" | "group_booking" | "other";
export type SourceType = "website" | "email" | "phone" | "voice_ai" | "chatbot" | "manual";

export interface Enquiry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  eventType: EventType;
  occasionType: string;
  venue: string;
  requestedDate: string;
  requestedTime: string;
  guestCount: number;
  estimatedValue: number;
  budgetBand?: string;
  notes?: string;
  stage: PipelineStage;
  probability: number;
  assignedTo: string;
  source: SourceType;
  /** Name of the Airship group this enquiry arrived through (form provenance). */
  airshipGroup?: string;
  createdAt: string;
  updatedAt: string;
  nextFollowUp?: string;
  lastActivity: string;
  depositAmount?: number;
  depositStatus?: "none" | "requested" | "paid";
  lostReason?: string;
  airshipSyncStatus: "synced" | "pending" | "not_synced" | "error";
}

export interface Activity {
  id: string;
  enquiryId: string;
  type: "note" | "call" | "email" | "stage_change" | "assignment" | "task";
  content: string;
  user: string;
  timestamp: string;
}

export const VENUES = ["The Grand Hall", "River Room", "Garden Terrace", "Sky Lounge", "The Cellar Bar", "Main Restaurant"];
export const USERS = ["Sarah Mitchell", "James Cooper", "Emma Wilson", "David Chen", "Lisa Brown"];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  birthday: "Birthday",
  wedding: "Wedding",
  private_dining: "Private Dining",
  christmas: "Christmas Party",
  corporate: "Corporate Event",
  celebration: "Celebration",
  group_booking: "Group Booking",
  other: "Other",
};

export const SOURCE_LABELS: Record<SourceType, string> = {
  website: "Website",
  email: "Email",
  phone: "Phone",
  voice_ai: "Voice AI",
  chatbot: "Chatbot",
  manual: "Manual",
};

const now = new Date();
const d = (daysOffset: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
};

export const MOCK_ENQUIRIES: Enquiry[] = [
  { id: "ENQ-001", firstName: "Charlotte", lastName: "Hughes", email: "charlotte@email.com", phone: "07700123456", companyName: "Hughes & Co", eventType: "wedding", occasionType: "Wedding Reception", venue: "The Grand Hall", requestedDate: d(45), requestedTime: "14:00", guestCount: 120, estimatedValue: 15000, stage: "proposal", probability: 50, assignedTo: "Sarah Mitchell", source: "website", createdAt: d(-10), updatedAt: d(-1), lastActivity: d(-1), nextFollowUp: d(2), depositAmount: 3000, depositStatus: "none", airshipSyncStatus: "synced" },
  { id: "ENQ-002", firstName: "Marcus", lastName: "Taylor", email: "marcus.t@corp.com", phone: "07700234567", companyName: "Taylor Industries", eventType: "corporate", occasionType: "Annual Gala", venue: "Sky Lounge", requestedDate: d(30), requestedTime: "18:00", guestCount: 80, estimatedValue: 8500, stage: "qualified", probability: 35, assignedTo: "James Cooper", source: "email", createdAt: d(-5), updatedAt: d(-2), lastActivity: d(-2), nextFollowUp: d(1), airshipSyncStatus: "synced" },
  { id: "ENQ-003", firstName: "Sophie", lastName: "Ward", email: "sophie.w@gmail.com", phone: "07700345678", eventType: "birthday", occasionType: "30th Birthday", venue: "The Cellar Bar", requestedDate: d(14), requestedTime: "19:30", guestCount: 40, estimatedValue: 2800, stage: "deposit_paid", probability: 90, assignedTo: "Emma Wilson", source: "phone", createdAt: d(-20), updatedAt: d(-3), lastActivity: d(-3), depositAmount: 500, depositStatus: "paid", airshipSyncStatus: "synced" },
  { id: "ENQ-004", firstName: "Robert", lastName: "Chen", email: "r.chen@business.com", phone: "07700456789", companyName: "Chen Group", eventType: "christmas", occasionType: "Christmas Party", venue: "River Room", requestedDate: d(60), requestedTime: "19:00", guestCount: 65, estimatedValue: 5200, stage: "new", probability: 10, assignedTo: "", source: "website", createdAt: d(-1), updatedAt: d(-1), lastActivity: d(-1), airshipSyncStatus: "not_synced" },
  { id: "ENQ-005", firstName: "Amira", lastName: "Patel", email: "amira@celebrations.co", phone: "07700567890", eventType: "celebration", occasionType: "Engagement Party", venue: "Garden Terrace", requestedDate: d(21), requestedTime: "17:00", guestCount: 55, estimatedValue: 3800, stage: "provisional", probability: 70, assignedTo: "Sarah Mitchell", source: "chatbot", createdAt: d(-8), updatedAt: d(-1), lastActivity: d(-1), nextFollowUp: d(3), depositAmount: 750, depositStatus: "requested", airshipSyncStatus: "pending" },
  { id: "ENQ-006", firstName: "Tom", lastName: "Baker", email: "tom.baker@email.com", phone: "07700678901", eventType: "private_dining", occasionType: "Anniversary Dinner", venue: "Main Restaurant", requestedDate: d(7), requestedTime: "20:00", guestCount: 12, estimatedValue: 1200, stage: "confirmed", probability: 100, assignedTo: "David Chen", source: "phone", createdAt: d(-30), updatedAt: d(-5), lastActivity: d(-5), depositAmount: 300, depositStatus: "paid", airshipSyncStatus: "synced" },
  { id: "ENQ-007", firstName: "Jessica", lastName: "Moore", email: "jess.m@company.com", phone: "07700789012", companyName: "Moore Events", eventType: "corporate", occasionType: "Product Launch", venue: "Sky Lounge", requestedDate: d(35), requestedTime: "10:00", guestCount: 100, estimatedValue: 12000, stage: "contacted", probability: 20, assignedTo: "James Cooper", source: "voice_ai", createdAt: d(-3), updatedAt: d(-2), lastActivity: d(-2), nextFollowUp: d(0), airshipSyncStatus: "pending" },
  { id: "ENQ-008", firstName: "Daniel", lastName: "Smith", email: "dan.smith@gmail.com", phone: "07700890123", eventType: "birthday", occasionType: "50th Birthday", venue: "The Grand Hall", requestedDate: d(28), requestedTime: "18:30", guestCount: 75, estimatedValue: 6500, stage: "followup", probability: 55, assignedTo: "Lisa Brown", source: "website", createdAt: d(-12), updatedAt: d(-1), lastActivity: d(-1), nextFollowUp: d(-1), airshipSyncStatus: "synced" },
  { id: "ENQ-009", firstName: "Hannah", lastName: "Lewis", email: "hannah@email.com", phone: "07700901234", eventType: "wedding", occasionType: "Wedding Breakfast", venue: "Garden Terrace", requestedDate: d(90), requestedTime: "12:00", guestCount: 85, estimatedValue: 11000, stage: "deposit_requested", probability: 80, assignedTo: "Sarah Mitchell", source: "email", createdAt: d(-15), updatedAt: d(-2), lastActivity: d(-2), depositAmount: 2000, depositStatus: "requested", airshipSyncStatus: "synced" },
  { id: "ENQ-010", firstName: "Oliver", lastName: "King", email: "oliver.k@gmail.com", phone: "07701012345", eventType: "group_booking", occasionType: "Reunion Dinner", venue: "River Room", requestedDate: d(10), requestedTime: "19:00", guestCount: 30, estimatedValue: 2100, stage: "lost", probability: 0, assignedTo: "Emma Wilson", source: "manual", createdAt: d(-25), updatedAt: d(-7), lastActivity: d(-7), lostReason: "Chose competitor venue", airshipSyncStatus: "synced" },
  { id: "ENQ-011", firstName: "Grace", lastName: "Adams", email: "grace.a@email.com", phone: "07701123456", eventType: "christmas", occasionType: "Christmas Dinner", venue: "Main Restaurant", requestedDate: d(55), requestedTime: "19:00", guestCount: 45, estimatedValue: 3600, stage: "new", probability: 10, assignedTo: "", source: "website", createdAt: d(0), updatedAt: d(0), lastActivity: d(0), airshipSyncStatus: "not_synced" },
  { id: "ENQ-012", firstName: "William", lastName: "Scott", email: "will.scott@corp.com", phone: "07701234567", companyName: "Scott & Partners", eventType: "corporate", occasionType: "Team Building", venue: "The Cellar Bar", requestedDate: d(18), requestedTime: "16:00", guestCount: 25, estimatedValue: 2000, stage: "completed", probability: 100, assignedTo: "David Chen", source: "email", createdAt: d(-60), updatedAt: d(-40), lastActivity: d(-40), depositAmount: 400, depositStatus: "paid", airshipSyncStatus: "synced" },
];

export const MOCK_ACTIVITIES: Activity[] = [
  { id: "ACT-001", enquiryId: "ENQ-001", type: "stage_change", content: "Stage changed to Menu / Proposal Sent", user: "Sarah Mitchell", timestamp: d(-1) },
  { id: "ACT-002", enquiryId: "ENQ-001", type: "email", content: "Sent wedding package brochure and menu options", user: "Sarah Mitchell", timestamp: d(-2) },
  { id: "ACT-003", enquiryId: "ENQ-001", type: "call", content: "Initial call — discussed venue capacity and availability", user: "Sarah Mitchell", timestamp: d(-5) },
  { id: "ACT-004", enquiryId: "ENQ-001", type: "note", content: "Client prefers outdoor ceremony if weather permits. Backup indoor option needed.", user: "Sarah Mitchell", timestamp: d(-6) },
  { id: "ACT-005", enquiryId: "ENQ-002", type: "stage_change", content: "Stage changed to Qualified", user: "James Cooper", timestamp: d(-2) },
  { id: "ACT-006", enquiryId: "ENQ-003", type: "stage_change", content: "Stage changed to Deposit Paid — £500 received", user: "Emma Wilson", timestamp: d(-3) },
];

// Dashboard stats
export const DASHBOARD_STATS = {
  enquiriesToday: 2,
  enquiriesThisWeek: 8,
  enquiriesThisMonth: 24,
  openPipelineValue: 64800,
  confirmedValue: 22800,
  conversionRate: 32,
  avgResponseTime: "2.4 hrs",
  overdueFollowUps: 3,
  depositOutstanding: 2750,
};

export const MONTHLY_REVENUE = [
  { month: "Oct", confirmed: 18500, pipeline: 42000 },
  { month: "Nov", confirmed: 22000, pipeline: 38000 },
  { month: "Dec", confirmed: 35000, pipeline: 55000 },
  { month: "Jan", confirmed: 15000, pipeline: 30000 },
  { month: "Feb", confirmed: 19000, pipeline: 45000 },
  { month: "Mar", confirmed: 22800, pipeline: 64800 },
];

export const ENQUIRIES_BY_SOURCE = [
  { source: "Website", count: 12, value: 28000 },
  { source: "Email", count: 5, value: 18500 },
  { source: "Phone", count: 4, value: 10500 },
  { source: "Voice AI", count: 2, value: 12000 },
  { source: "Chatbot", count: 1, value: 3800 },
];

export const ENQUIRIES_BY_VENUE = [
  { venue: "The Grand Hall", count: 4, value: 22500 },
  { venue: "Sky Lounge", count: 3, value: 20500 },
  { venue: "Garden Terrace", count: 2, value: 14800 },
  { venue: "River Room", count: 2, value: 7300 },
  { venue: "The Cellar Bar", count: 2, value: 4800 },
  { venue: "Main Restaurant", count: 1, value: 4800 },
];

export const LEADERBOARD = [
  { user: "Sarah Mitchell", enquiries: 8, value: 29800, converted: 5, conversionRate: 63 },
  { user: "James Cooper", enquiries: 5, value: 20500, converted: 3, conversionRate: 60 },
  { user: "Emma Wilson", enquiries: 4, value: 8900, converted: 2, conversionRate: 50 },
  { user: "David Chen", enquiries: 4, value: 5800, converted: 3, conversionRate: 75 },
  { user: "Lisa Brown", enquiries: 3, value: 6500, converted: 1, conversionRate: 33 },
];
