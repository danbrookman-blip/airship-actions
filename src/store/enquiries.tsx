import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { MOCK_ENQUIRIES, type Enquiry, type PipelineStage } from "@/data/mockData";
import {
  MOCK_CUSTOMERS,
  DEFAULT_SEGMENTS,
  DEFAULT_WATCHED_SEGMENTS,
  type Customer,
  type Segment,
} from "@/data/customers";
import { getActionsAdapter, type AirshipGroup } from "@/lib/airship";
import { makeInboundEnquiry } from "@/lib/airship/groups";
import { DEFAULT_STAGES, findStage, entryStage, type Stage } from "@/lib/stages";

/** Bump to invalidate persisted snapshots when the data model changes. */
const SCHEMA_VERSION = 3;
const STORAGE_KEY = `airship-actions:v${SCHEMA_VERSION}`;

interface Snapshot {
  enquiries: Enquiry[];
  stages: Stage[];
  watchedSegments?: string[];
  /** Ids of enquiries the user edited/added locally — preserved across a fresh
   *  adapter fetch (incl. live mode) so edits aren't overwritten by the server. */
  editedIds?: string[];
}

function loadSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Snapshot;
    return Array.isArray(s?.enquiries) && Array.isArray(s?.stages) ? s : null;
  } catch {
    return null;
  }
}

function saveSnapshot(s: Snapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable (private mode / quota) — persistence is best-effort */
  }
}

/**
 * Single source of truth for enquiries AND the pipeline stage configuration.
 *
 * Enquiries originate from the Airship adapter (sample or live). Stages are
 * user-definable (see Admin) and live here so the Pipeline, Inbox and agentic
 * task engine all read one consistent, editable definition. Held in memory and
 * shared via context so a drag on the Pipeline updates the Inbox in the same
 * render pass.
 */

interface EnquiriesContextValue {
  enquiries: Enquiry[];
  customers: Customer[];
  groups: AirshipGroup[];
  source: "live" | "sample";

  // Segment-entry triggers (configurable)
  segments: Segment[];
  watchedSegments: string[];
  toggleWatchedSegment: (id: string) => void;

  // Stage configuration (user-definable)
  stages: Stage[];
  addStage: (stage?: Partial<Stage>) => void;
  updateStage: (id: string, patch: Partial<Stage>) => void;
  removeStage: (id: string) => void;
  moveStage: (id: string, dir: -1 | 1) => void;

  // Enquiry mutations
  setStage: (id: string, stageId: string) => void;
  updateEnquiry: (id: string, patch: Partial<Enquiry>) => void;
  addEnquiry: (enquiry: Enquiry) => void;
  simulateInbound: () => Enquiry | null;

  /** Clear persisted state and reseed stages + enquiries from the adapter. */
  resetDemo: () => void;
}

const EnquiriesContext = createContext<EnquiriesContextValue | null>(null);

export function EnquiriesProvider({ children }: { children: ReactNode }) {
  const adapter = useMemo(() => getActionsAdapter(), []);
  const persisted = useMemo(() => loadSnapshot(), []);
  const [enquiries, setEnquiries] = useState<Enquiry[]>(persisted?.enquiries ?? MOCK_ENQUIRIES);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [groups, setGroups] = useState<AirshipGroup[]>([]);
  const [segments, setSegments] = useState<Segment[]>(DEFAULT_SEGMENTS);
  const [watchedSegments, setWatchedSegments] = useState<string[]>(
    () => persisted?.watchedSegments ?? [...DEFAULT_WATCHED_SEGMENTS]
  );
  const [stages, setStages] = useState<Stage[]>(
    () => persisted?.stages ?? DEFAULT_STAGES.map((s) => ({ ...s }))
  );
  // Ids the user has edited/added locally — preserved when the adapter refetches.
  const editedIds = useRef<Set<string>>(new Set(persisted?.editedIds ?? []));
  const inboundSeed = useRef(0);
  const newStageSeq = useRef(0);

  // Always refresh from the adapter (groups, customers, segments are read-only).
  // Enquiries are MERGED: fresh server/sample records form the base, but any
  // locally-edited or locally-added enquiry (tracked in editedIds) is kept — so
  // edits survive a reload in both sample and live mode without blocking fresh
  // server data for untouched records.
  useEffect(() => {
    let active = true;
    adapter.listGroups().then((gs) => active && setGroups(gs));
    adapter.listCustomers().then((cs) => active && cs.length && setCustomers(cs));
    adapter.listSegments().then((ss) => active && ss.length && setSegments(ss));
    adapter.listEnquiries().then((server) => {
      if (!active) return;
      setEnquiries((prev) => {
        const edited = editedIds.current;
        if (edited.size === 0) return server; // nothing local to preserve
        const prevById = new Map(prev.map((e) => [e.id, e]));
        const serverIds = new Set(server.map((e) => e.id));
        const merged = server.map((se) => (edited.has(se.id) ? prevById.get(se.id) ?? se : se));
        const localOnly = prev.filter((e) => edited.has(e.id) && !serverIds.has(e.id));
        return [...localOnly, ...merged];
      });
    });
    return () => {
      active = false;
    };
  }, [adapter]);

  // Persist enquiries + config + the set of locally-edited ids on every change.
  useEffect(() => {
    saveSnapshot({ enquiries, stages, watchedSegments, editedIds: [...editedIds.current] });
  }, [enquiries, stages, watchedSegments]);

  const setStage = useCallback(
    (id: string, stageId: string) => {
      editedIds.current.add(id);
      setEnquiries((prev) =>
        prev.map((e) => {
          if (e.id !== id || e.stage === stageId) return e;
          const now = new Date().toISOString();
          return {
            ...e,
            stage: stageId as PipelineStage,
            probability: findStage(stages, stageId)?.probability ?? e.probability,
            updatedAt: now,
            lastActivity: now,
            depositStatus: stageId === "deposit_paid" ? "paid" : e.depositStatus,
          };
        })
      );
    },
    [stages]
  );

  const updateEnquiry = useCallback((id: string, patch: Partial<Enquiry>) => {
    editedIds.current.add(id);
    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const addEnquiry = useCallback((enquiry: Enquiry) => {
    editedIds.current.add(enquiry.id);
    setEnquiries((prev) => [enquiry, ...prev]);
  }, []);

  const simulateInbound = useCallback((): Enquiry | null => {
    if (!groups.length) return null;
    const group = groups[inboundSeed.current % groups.length];
    const enquiry = makeInboundEnquiry(group, inboundSeed.current);
    inboundSeed.current += 1;
    editedIds.current.add(enquiry.id);
    setEnquiries((prev) => [enquiry, ...prev]);
    return enquiry;
  }, [groups]);

  // ---- Stage configuration CRUD ----

  const addStage = useCallback((stage?: Partial<Stage>) => {
    newStageSeq.current += 1;
    const id = stage?.id ?? `custom_${newStageSeq.current}_${Math.round(performance.now())}`;
    const newStage: Stage = {
      id,
      label: stage?.label ?? "New stage",
      color: stage?.color ?? "hsl(205,100%,61%)",
      probability: stage?.probability ?? 50,
      ...stage,
    };
    // Insert before the first terminal stage so closed stages stay at the end.
    setStages((prev) => {
      const firstTerminal = prev.findIndex((s) => s.isTerminal);
      if (firstTerminal === -1) return [...prev, newStage];
      return [...prev.slice(0, firstTerminal), newStage, ...prev.slice(firstTerminal)];
    });
  }, []);

  const updateStage = useCallback((id: string, patch: Partial<Stage>) => {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const removeStage = useCallback(
    (id: string) => {
      if (stages.length <= 1) return;
      const fallback = stages.find((s) => s.isEntry && s.id !== id) ?? stages.find((s) => s.id !== id);
      if (!fallback) return;
      // Reassign any enquiries sitting in the removed stage to the entry stage.
      setEnquiries((es) =>
        es.map((e) => (e.stage === id ? { ...e, stage: fallback.id as PipelineStage } : e))
      );
      setStages((prev) => prev.filter((s) => s.id !== id));
    },
    [stages]
  );

  const toggleWatchedSegment = useCallback((id: string) => {
    setWatchedSegments((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const resetDemo = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    editedIds.current = new Set();
    setStages(DEFAULT_STAGES.map((s) => ({ ...s })));
    setWatchedSegments([...DEFAULT_WATCHED_SEGMENTS]);
    adapter.listEnquiries().then(setEnquiries);
  }, [adapter]);

  const moveStage = useCallback((id: string, dir: -1 | 1) => {
    setStages((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  return (
    <EnquiriesContext.Provider
      value={{
        enquiries,
        customers,
        groups,
        source: adapter.source,
        segments,
        watchedSegments,
        toggleWatchedSegment,
        stages,
        addStage,
        updateStage,
        removeStage,
        moveStage,
        setStage,
        updateEnquiry,
        addEnquiry,
        simulateInbound,
        resetDemo,
      }}
    >
      {children}
    </EnquiriesContext.Provider>
  );
}

export function useEnquiries(): EnquiriesContextValue {
  const ctx = useContext(EnquiriesContext);
  if (!ctx) throw new Error("useEnquiries must be used within an EnquiriesProvider");
  return ctx;
}
