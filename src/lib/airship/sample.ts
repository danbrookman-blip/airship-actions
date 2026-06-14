/**
 * Sample adapter. Serves the built-in mock enquiries with believable Airship
 * group provenance attached, so the platform runs with zero configuration and
 * faithfully previews the live experience. Swapped for the live client the
 * moment an API token is present (see index.ts).
 */

import { MOCK_ENQUIRIES, type Enquiry } from "@/data/mockData";
import { MOCK_CUSTOMERS, DEFAULT_SEGMENTS, type Customer, type Segment } from "@/data/customers";
import type { ActionsAdapter, AirshipGroup, ContactQuery } from "./types";
import { DEFAULT_GROUPS, groupForEnquiry } from "./groups";

export class SampleActionsAdapter implements ActionsAdapter {
  readonly source = "sample" as const;

  async listGroups(): Promise<AirshipGroup[]> {
    return DEFAULT_GROUPS;
  }

  async listEnquiries(): Promise<Enquiry[]> {
    // Stamp each mock enquiry with the group it would have arrived through.
    return MOCK_ENQUIRIES.map((e) => ({
      ...e,
      airshipGroup: e.airshipGroup ?? groupForEnquiry(e).name,
    }));
  }

  async listCustomers(): Promise<Customer[]> {
    return MOCK_CUSTOMERS;
  }

  async searchContact(query: ContactQuery): Promise<Customer | null> {
    const email = query.email?.toLowerCase();
    const name = `${query.firstName ?? ""} ${query.lastName ?? ""}`.trim().toLowerCase();
    return (
      MOCK_CUSTOMERS.find((c) => {
        if (email) return c.email.toLowerCase() === email;
        if (query.mobile) return c.phone === query.mobile;
        if (name) return `${c.firstName} ${c.lastName}`.toLowerCase() === name;
        return false;
      }) ?? null
    );
  }

  async listSegments(): Promise<Segment[]> {
    return DEFAULT_SEGMENTS;
  }
}
