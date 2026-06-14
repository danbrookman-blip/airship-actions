/**
 * Adapter selector — the single swap point between live and sample data.
 *
 *   - VITE_AIRSHIP_LIVE === "true" → LiveActionsClient (reads via the same-origin
 *                                    /api/airship proxy, which holds the token)
 *   - otherwise                    → SampleActionsAdapter (zero-config demo data)
 *
 * The token itself is NEVER read in the browser — only this non-secret flag.
 * The rest of the app imports only `getActionsAdapter()` and the types.
 */

import { LiveActionsClient } from "./client";
import { SampleActionsAdapter } from "./sample";
import type { ActionsAdapter } from "./types";

export function getActionsAdapter(): ActionsAdapter {
  const live = import.meta.env.VITE_AIRSHIP_LIVE?.trim() === "true";
  if (live) return new LiveActionsClient();
  return new SampleActionsAdapter();
}

export * from "./types";
export { DEFAULT_GROUPS, makeInboundEnquiry } from "./groups";
