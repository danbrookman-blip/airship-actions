/**
 * User-definable pipeline stages.
 *
 * Stages are data, not a hardcoded enum — the user can rename, recolour,
 * reorder, add and remove them (see the Admin page + the store). The agentic
 * task engine keys off semantic **flags** (`isEntry`/`isWon`/`isTerminal`)
 * rather than specific stage ids, so renaming "New Enquiry" to anything else
 * doesn't break the SLA logic.
 *
 * Seeded from the original 12-stage model; colours are HSL strings (applied
 * inline) so custom stages can carry any colour.
 */

export interface Stage {
  id: string;
  label: string;
  /** CSS colour string (hsl) — applied inline so custom stages work. */
  color: string;
  /** Win-likelihood shown on the stage, 0–100. */
  probability: number;
  /** Entry stage for brand-new submissions (drives first-response SLA). */
  isEntry?: boolean;
  /** Deal is effectively secured (clears the "confirm before event" task). */
  isWon?: boolean;
  /** Closed/out of the active pipeline (lost, cancelled, completed). */
  isTerminal?: boolean;
}

export const DEFAULT_STAGES: Stage[] = [
  { id: "new", label: "New Enquiry", color: "hsl(205,100%,61%)", probability: 10, isEntry: true },
  { id: "contacted", label: "Contact Attempted", color: "hsl(190,70%,45%)", probability: 20 },
  { id: "qualified", label: "Qualified", color: "hsl(170,65%,40%)", probability: 35 },
  { id: "proposal", label: "Menu / Proposal Sent", color: "hsl(45,90%,50%)", probability: 50 },
  { id: "followup", label: "Follow-up Due", color: "hsl(30,85%,50%)", probability: 55 },
  { id: "provisional", label: "Provisional Hold", color: "hsl(283,60%,55%)", probability: 70 },
  { id: "deposit_requested", label: "Deposit Requested", color: "hsl(320,60%,50%)", probability: 80 },
  { id: "deposit_paid", label: "Deposit Paid", color: "hsl(340,70%,55%)", probability: 90, isWon: true },
  { id: "confirmed", label: "Confirmed", color: "hsl(94,55%,48%)", probability: 100, isWon: true },
  { id: "lost", label: "Lost", color: "hsl(0,60%,50%)", probability: 0, isTerminal: true },
  { id: "cancelled", label: "Cancelled", color: "hsl(0,0%,55%)", probability: 0, isTerminal: true },
  { id: "completed", label: "Completed", color: "hsl(212,31%,40%)", probability: 100, isWon: true, isTerminal: true },
];

/** Stages shown as columns on the pipeline board (everything not closed). */
export const activeStages = (stages: Stage[]): Stage[] => stages.filter((s) => !s.isTerminal);

export const findStage = (stages: Stage[], id: string): Stage | undefined =>
  stages.find((s) => s.id === id);

/** The entry stage (falls back to the first stage if none flagged). */
export const entryStage = (stages: Stage[]): Stage =>
  stages.find((s) => s.isEntry) ?? stages[0];

/** Resilient label/colour lookups (fall back gracefully for unknown ids). */
export const stageLabel = (stages: Stage[], id: string): string =>
  findStage(stages, id)?.label ?? id;
export const stageColor = (stages: Stage[], id: string): string =>
  findStage(stages, id)?.color ?? "hsl(212,16%,46%)";

export interface StageFlags {
  isEntry: boolean;
  isWon: boolean;
  isTerminal: boolean;
}

/** Map of stage id → semantic flags, for the agentic task engine. */
export function stageMeta(stages: Stage[]): Map<string, StageFlags> {
  return new Map(
    stages.map((s) => [
      s.id,
      { isEntry: !!s.isEntry, isWon: !!s.isWon, isTerminal: !!s.isTerminal },
    ])
  );
}
