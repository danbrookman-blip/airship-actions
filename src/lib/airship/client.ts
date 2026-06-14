/**
 * Live Airship REST client (Actions platform).
 *
 * Reads contacts from Airship groups and maps each into our `Enquiry` shape.
 *
 * It talks to the SAME-ORIGIN proxy at `/api/airship` (see airship-proxy.ts),
 * never to Airship directly — so no token touches the browser and there's no
 * CORS. The proxy attaches the Authorization header server-side.
 *
 * Verification note: the endpoint paths and field names below are best-effort
 * from Airship's docs and have NOT been validated against a live account.
 * Everything Airship-specific is isolated in CONFIG + the `map*` functions, so
 * when a real payload is available you correct it in one place — the store and
 * UI never change.
 *
 * Selection is automatic in index.ts: VITE_AIRSHIP_LIVE=true → this client.
 */

import { EVENT_TYPE_LABELS, type Enquiry, type EventType, type PipelineStage } from "@/data/mockData";
import { TRACKED_CONTACT_EMAILS, type Customer, type Feedback, type Segment, type Sentiment } from "@/data/customers";
import type { ActionsAdapter, AirshipGroup, ContactQuery } from "./types";
import { DEFAULT_GROUPS } from "./groups";

/** Everything that might need correcting once we see a real payload. */
const CONFIG = {
  /** Same-origin proxy; the server forwards to the real Airship API. */
  baseUrl: "/api/airship",
  endpoints: {
    groups: "/groups",
    /** Contacts within a group. {id} is substituted. */
    groupContacts: "/groups/{id}/contacts",
    /** Search Contact — look a contact up by email / mobile / name. */
    searchContact: "/contacts",
    /** Dynamic segment catalogue. */
    segments: "/segments",
  },
  pageSize: 200,
  maxContactsPerGroup: 2000,
  /** Default new-submission stage. */
  newStage: "new" as PipelineStage,
};

interface Paged {
  data?: unknown[];
  results?: unknown[];
  items?: unknown[];
  next?: string | null;
  next_page?: string | null;
}

const extractList = (p: Paged): unknown[] => p.data ?? p.results ?? p.items ?? [];
const extractNext = (p: Paged): string | null => p.next ?? p.next_page ?? null;

async function getJson<T>(url: string): Promise<T> {
  // No auth header here — the same-origin proxy attaches the token server-side.
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Airship API ${res.status} ${res.statusText} for ${url}${body ? ` — ${body.slice(0, 300)}` : ""}`);
  }
  return (await res.json()) as T;
}

const str = (v: unknown, fallback = ""): string => (v == null ? fallback : String(v));
const num = (v: unknown): number => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

function mapGroup(raw: Record<string, unknown>): AirshipGroup {
  return {
    id: str(raw.id ?? raw.group_id ?? raw.uuid),
    name: str(raw.name ?? raw.title, "Untitled group"),
    formType: "general",
    source: "website",
    description: str(raw.description ?? raw.summary),
  };
}

/** The single most likely thing to need correcting against a real payload. */
function mapContactToEnquiry(raw: Record<string, unknown>, group: AirshipGroup): Enquiry {
  const eventType = (str(raw.event_type, "other") as EventType) || "other";
  const created = str(raw.created_at ?? raw.created, new Date().toISOString());
  return {
    id: str(raw.id ?? raw.contact_id),
    firstName: str(raw.first_name ?? raw.firstname),
    lastName: str(raw.last_name ?? raw.lastname),
    email: str(raw.email),
    phone: str(raw.phone ?? raw.mobile),
    companyName: raw.company_name ? str(raw.company_name) : undefined,
    eventType,
    occasionType: str(raw.occasion ?? EVENT_TYPE_LABELS[eventType] ?? "Enquiry"),
    venue: str(raw.venue ?? raw.location, "Unassigned"),
    requestedDate: str(raw.event_date ?? raw.requested_date, created),
    requestedTime: str(raw.event_time ?? raw.requested_time, "12:00"),
    guestCount: num(raw.guest_count ?? raw.guests),
    estimatedValue: num(raw.estimated_value ?? raw.value),
    stage: CONFIG.newStage,
    probability: 10,
    assignedTo: str(raw.assigned_to),
    source: group.source,
    airshipGroup: group.name,
    createdAt: created,
    updatedAt: str(raw.updated_at ?? raw.updated, created),
    lastActivity: str(raw.last_activity ?? raw.updated_at, created),
    airshipSyncStatus: "synced",
  };
}

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Airship feedback sentiment: type_id 1=positive, 2=negative, 3=neutral, 4=unknown. */
function sentimentFromTypeId(typeId: unknown): Sentiment {
  switch (num(typeId)) {
    case 1:
      return "positive";
    case 2:
      return "negative";
    default:
      return "neutral";
  }
}

function mapFeedbackEntry(raw: Record<string, unknown>): Feedback {
  const ratings = asArray(raw.ratings);
  const ratingText = ratings.length ? (ratings[0] as Record<string, unknown>).rating_text : undefined;
  return {
    date: str(raw.date ?? raw.created_at ?? raw.datetime),
    sentiment: sentimentFromTypeId(raw.type_id),
    score: ratingText != null ? num(ratingText) : undefined,
    comment: raw.comments ? str(raw.comments) : undefined,
  };
}

/**
 * Assemble a Customer from a Search Contact result + its sub-resources.
 * `index` is the search response (dob + resource links); `feedbackRaw`/`popsRaw`
 * are the followed feedback / proof_of_presence lists. Best-effort against the
 * documented shapes — isolated here so a real payload is corrected in one spot.
 */
function mapSearchResultToCustomer(
  query: ContactQuery,
  index: Record<string, unknown>,
  feedbackRaw: unknown,
  popsRaw: unknown
): Customer {
  const visits = asArray(popsRaw)
    .map((p) => str((p as Record<string, unknown>)?.datetime ?? (p as Record<string, unknown>)?.date))
    .filter(Boolean)
    .map((d) => d.slice(0, 10)); // normalise to YYYY-MM-DD
  const feedback: Feedback[] = asArray(feedbackRaw).map((f) => mapFeedbackEntry(f as Record<string, unknown>));
  return {
    id: str(index.id ?? index.contact_id ?? query.email ?? query.mobile),
    firstName: str(index.first_name ?? query.firstName),
    lastName: str(index.last_name ?? query.lastName),
    email: str(index.email ?? query.email),
    phone: query.mobile || index.mobile_number ? str(index.mobile_number ?? query.mobile) : undefined,
    dateOfBirth: str(index.dob),
    visits,
    feedback,
    totalSpend: num(index.total_spend),
    // Segment membership isn't part of the contact API — it's push-driven.
    segments: [],
  };
}

function mapSegment(raw: Record<string, unknown>): Segment {
  return {
    id: str(raw.id ?? raw.segment_id ?? raw.uuid),
    name: str(raw.name ?? raw.title, "Untitled segment"),
    description: str(raw.description ?? raw.summary),
  };
}

export class LiveActionsClient implements ActionsAdapter {
  readonly source = "live" as const;

  /** Resolve a path/upstream-link to a same-origin proxy URL. */
  private url(path: string): string {
    if (path.startsWith(CONFIG.baseUrl)) return path;
    if (path.startsWith("http")) {
      // An absolute pagination link from upstream — route it back through the
      // proxy (drop a leading API-version segment like /v1).
      const u = new URL(path);
      return `${CONFIG.baseUrl}${(u.pathname + u.search).replace(/^\/v\d+/, "")}`;
    }
    return `${CONFIG.baseUrl}${path}`;
  }

  async listGroups(): Promise<AirshipGroup[]> {
    const payload = await getJson<Paged>(this.url(CONFIG.endpoints.groups));
    const groups = extractList(payload).map((g) => mapGroup(g as Record<string, unknown>));
    return groups.length ? groups : DEFAULT_GROUPS;
  }

  private async fetchGroupContacts(group: AirshipGroup): Promise<Enquiry[]> {
    const out: Enquiry[] = [];
    let path: string | null =
      CONFIG.endpoints.groupContacts.replace("{id}", encodeURIComponent(group.id)) +
      `?limit=${CONFIG.pageSize}`;
    while (path && out.length < CONFIG.maxContactsPerGroup) {
      const payload: Paged = await getJson<Paged>(this.url(path));
      for (const c of extractList(payload)) {
        out.push(mapContactToEnquiry(c as Record<string, unknown>, group));
      }
      path = extractNext(payload);
    }
    return out;
  }

  async listEnquiries(): Promise<Enquiry[]> {
    const groups = await this.listGroups();
    const all: Enquiry[] = [];
    for (const g of groups) all.push(...(await this.fetchGroupContacts(g)));
    return all;
  }

  /**
   * Look up + enrich one contact (Airship Search Contact).
   *
   * Airship documents this as GET /v1/contacts with a JSON body
   * `{account_id, email|mobile_number|name}`. Browsers (and Node) can't send a
   * body on GET, so we pass the criterion as a query param and let the proxy/
   * server reconcile the exact upstream shape (incl. account_id) once a real
   * token is configured. The response is a contact index (dob + links to the
   * feedback / proof_of_presence sub-resources), which we follow to build the
   * full Customer.
   */
  async searchContact(query: ContactQuery): Promise<Customer | null> {
    const params = new URLSearchParams();
    if (query.email) params.set("email", query.email);
    else if (query.mobile) params.set("mobile_number", query.mobile);
    else if (query.firstName || query.lastName) {
      params.set("first_name", query.firstName ?? "");
      params.set("last_name", query.lastName ?? "");
    } else {
      return null;
    }

    let index: Record<string, unknown>;
    try {
      index = await getJson<Record<string, unknown>>(this.url(`${CONFIG.endpoints.searchContact}?${params}`));
    } catch {
      return null; // not found / unauthorised / upstream error
    }
    if (!index || typeof index !== "object") return null;

    const [feedbackRaw, popsRaw] = await Promise.all([
      index.feedback ? getJson(this.url(String(index.feedback))).catch(() => []) : Promise.resolve([]),
      index.proof_of_presence
        ? getJson(this.url(String(index.proof_of_presence))).catch(() => [])
        : Promise.resolve([]),
    ]);

    return mapSearchResultToCustomer(query, index, feedbackRaw, popsRaw);
  }

  /**
   * Airship has no "list all contacts" endpoint, so we enrich the contacts we
   * track one by one via Search Contact (parallelised). The tracked set comes
   * from our own form/journey captures (sample emails stand in here).
   */
  async listCustomers(): Promise<Customer[]> {
    const results = await Promise.all(
      TRACKED_CONTACT_EMAILS.map((email) => this.searchContact({ email }).catch(() => null))
    );
    return results.filter((c): c is Customer => c !== null);
  }

  async listSegments(): Promise<Segment[]> {
    const payload = await getJson<Paged>(this.url(CONFIG.endpoints.segments));
    return extractList(payload).map((s) => mapSegment(s as Record<string, unknown>));
  }
}
