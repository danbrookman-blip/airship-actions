/**
 * Default Airship groups (the website forms this workspace listens to) plus the
 * helpers that map between groups and enquiries. Kept separate from the adapters
 * so both the sample provider and the live client share one definition.
 */

import {
  EVENT_TYPE_LABELS,
  VENUES,
  type Enquiry,
  type EventType,
} from "@/data/mockData";
import type { AirshipGroup } from "./types";

export const DEFAULT_GROUPS: AirshipGroup[] = [
  {
    id: "grp-party-enquiry",
    name: "Party Enquiry Form",
    formType: "party_enquiry",
    source: "website",
    description: "Website party & private-dining enquiry form",
  },
  {
    id: "grp-contact-us",
    name: "Contact Us Form",
    formType: "contact_us",
    source: "email",
    description: "General website contact form",
  },
  {
    id: "grp-christmas",
    name: "Christmas Party Form",
    formType: "christmas",
    source: "website",
    description: "Seasonal Christmas party landing-page form",
  },
];

const GROUP_BY_ID = new Map(DEFAULT_GROUPS.map((g) => [g.id, g]));
export const getGroup = (id: string): AirshipGroup | undefined => GROUP_BY_ID.get(id);

/**
 * Deterministically attribute an existing enquiry to the group it most likely
 * arrived through, so sample data carries believable form provenance.
 */
export function groupForEnquiry(e: Enquiry): AirshipGroup {
  if (e.eventType === "christmas") return DEFAULT_GROUPS[2];
  if (e.source === "website" || e.source === "chatbot") return DEFAULT_GROUPS[0];
  return DEFAULT_GROUPS[1];
}

// ---- Inbound submission factory (for demonstrating form → group → inbox) ----

interface InboundContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventType: EventType;
  occasion: string;
  guestCount: number;
  estimatedValue: number;
}

/** A small rotating pool so simulated submissions feel real and varied. */
const INBOUND_POOL: InboundContact[] = [
  { firstName: "Priya", lastName: "Sharma", email: "priya.sharma@gmail.com", phone: "07700456123", eventType: "birthday", occasion: "40th Birthday", guestCount: 35, estimatedValue: 2600 },
  { firstName: "Liam", lastName: "O'Connor", email: "liam.oconnor@work.com", phone: "07700456124", eventType: "corporate", occasion: "Team Offsite Dinner", guestCount: 22, estimatedValue: 1900 },
  { firstName: "Nadia", lastName: "Hassan", email: "nadia.h@email.com", phone: "07700456125", eventType: "celebration", occasion: "Graduation Party", guestCount: 48, estimatedValue: 3400 },
  { firstName: "George", lastName: "Fielding", email: "g.fielding@gmail.com", phone: "07700456126", eventType: "wedding", occasion: "Engagement Drinks", guestCount: 60, estimatedValue: 5200 },
  { firstName: "Mei", lastName: "Tanaka", email: "mei.tanaka@email.com", phone: "07700456127", eventType: "private_dining", occasion: "Anniversary Dinner", guestCount: 10, estimatedValue: 1100 },
  { firstName: "Tariq", lastName: "Aziz", email: "tariq.aziz@biz.com", phone: "07700456128", eventType: "christmas", occasion: "Office Christmas Party", guestCount: 70, estimatedValue: 6100 },
];

/**
 * Mint a brand-new enquiry as if a customer just submitted `group`'s form.
 * Lands in the "new" stage, unassigned and freshly synced — which immediately
 * starts the first-response SLA clock the agentic engine watches.
 *
 * `seed` rotates the contact pool; `now` is injected for testability.
 */
export function makeInboundEnquiry(group: AirshipGroup, seed: number, now: Date = new Date()): Enquiry {
  const base = INBOUND_POOL[seed % INBOUND_POOL.length];
  const eventType: EventType = group.formType === "christmas" ? "christmas" : base.eventType;
  const iso = now.toISOString();
  const eventDate = new Date(now);
  eventDate.setDate(eventDate.getDate() + 21 + (seed % 30));

  return {
    id: `ENQ-${String(now.getTime()).slice(-5)}`,
    firstName: base.firstName,
    lastName: base.lastName,
    email: base.email,
    phone: base.phone,
    eventType,
    occasionType: group.formType === "christmas" ? "Christmas Party" : base.occasion,
    venue: VENUES[seed % VENUES.length],
    requestedDate: eventDate.toISOString(),
    requestedTime: "19:00",
    guestCount: base.guestCount,
    estimatedValue: base.estimatedValue,
    stage: "new",
    probability: 10,
    assignedTo: "",
    source: group.source,
    airshipGroup: group.name,
    createdAt: iso,
    updatedAt: iso,
    lastActivity: iso,
    airshipSyncStatus: "synced",
  };
}
