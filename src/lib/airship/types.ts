/**
 * Airship adapter contract for the Actions platform.
 *
 * An enquiry's journey starts as a website form submission that Airship writes
 * into a **group** (a tag-based contact list). This platform reads those groups
 * and maps each contact + their submission into our `Enquiry` domain shape, then
 * surfaces it in the Actions Inbox.
 *
 * Both the sample provider and the live REST client implement `ActionsAdapter`,
 * so the rest of the app only ever sees this interface — never raw Airship
 * payloads. Same adapter discipline as the airship-scv project: anything that
 * might differ against a real account is isolated behind here.
 */

import type { Enquiry, SourceType } from "@/data/mockData";
import type { Customer, Segment } from "@/data/customers";

/** The website form behind a group — drives default routing + iconography. */
export type GroupFormType = "party_enquiry" | "contact_us" | "christmas" | "general";

/**
 * An Airship group. A website form submission appends a contact to one of
 * these; the platform turns new members into enquiries.
 */
export interface AirshipGroup {
  id: string;
  name: string;
  formType: GroupFormType;
  /** How a submission via this group is attributed on the enquiry. */
  source: SourceType;
  description: string;
}

/** Criteria for an Airship Search Contact lookup (one of these). */
export interface ContactQuery {
  email?: string;
  mobile?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * The adapter contract. `source` reports whether data is coming from the live
 * Airship API or the built-in sample provider.
 */
export interface ActionsAdapter {
  readonly source: "live" | "sample";
  /** The Airship groups (forms) this workspace is listening to. */
  listGroups(): Promise<AirshipGroup[]>;
  /** Every enquiry across all listened-to groups, mapped to the domain shape. */
  listEnquiries(): Promise<Enquiry[]>;
  /** Customers (Airship contacts) behind the CRM/segment-triggered actions. */
  listCustomers(): Promise<Customer[]>;
  /** Look up + enrich a single contact via Airship's Search Contact. */
  searchContact(query: ContactQuery): Promise<Customer | null>;
  /** The catalogue of dynamic segments available to watch. */
  listSegments(): Promise<Segment[]>;
}
