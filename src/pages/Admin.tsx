import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";
import { VENUES, USERS } from "@/data/mockData";
import { useEnquiries } from "@/store/enquiries";
import { type Stage } from "@/lib/stages";

type StageRole = "entry" | "active" | "won" | "closed";

const roleOf = (s: Stage): StageRole =>
  s.isEntry ? "entry" : s.isWon ? "won" : s.isTerminal ? "closed" : "active";

/** Convert an "hsl(h,s%,l%)" string to #rrggbb for the native colour input. */
function toHex(color: string): string {
  if (color.startsWith("#")) return color;
  const m = color.match(/hsl\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/i);
  if (!m) return "#888888";
  const h = +m[1], s = +m[2] / 100, l = +m[3] / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const hx = (x: number) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${hx(f(0))}${hx(f(8))}${hx(f(4))}`;
}

export default function Admin() {
  const {
    stages, addStage, updateStage, removeStage, moveStage, resetDemo,
    segments, watchedSegments, toggleWatchedSegment,
  } = useEnquiries();

  const setRole = (s: Stage, role: StageRole) => {
    if (role === "entry") {
      stages.forEach((o) => o.isEntry && o.id !== s.id && updateStage(o.id, { isEntry: false }));
      updateStage(s.id, { isEntry: true, isWon: false, isTerminal: false });
    } else if (role === "won") {
      updateStage(s.id, { isEntry: false, isWon: true, isTerminal: false });
    } else if (role === "closed") {
      updateStage(s.id, { isEntry: false, isWon: false, isTerminal: true });
    } else {
      updateStage(s.id, { isEntry: false, isWon: false, isTerminal: false });
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin &amp; Settings</h1>
          <p className="text-sm text-muted-foreground">Configure pipeline stages, venues and notification rules</p>
        </div>
        <Button variant="outline" size="sm" onClick={resetDemo}>Reset demo data</Button>
      </div>

      {/* Pipeline stages — user-definable */}
      <div className="rounded-xl bg-card p-5 shadow-card">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Pipeline Stages</h3>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => addStage()}>
            <Plus className="h-4 w-4" /> Add Stage
          </Button>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Rename, recolour, reorder or remove stages. The <strong>Entry</strong> stage receives new
          submissions; <strong>Won</strong> settles the deal; <strong>Closed</strong> stages drop off the board.
        </p>
        <div className="space-y-2">
          {stages.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
              <div className="flex flex-col">
                <button
                  onClick={() => moveStage(s.id, -1)}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveStage(s.id, 1)}
                  disabled={i === stages.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <span className="w-4 text-center text-xs font-medium text-muted-foreground">{i + 1}</span>

              <input
                type="color"
                value={toHex(s.color)}
                onChange={(e) => updateStage(s.id, { color: e.target.value })}
                className="h-7 w-7 cursor-pointer rounded border border-border bg-transparent p-0"
                aria-label="Stage colour"
              />

              <Input
                value={s.label}
                onChange={(e) => updateStage(s.id, { label: e.target.value })}
                className="h-8 flex-1 text-sm"
              />

              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={s.probability}
                  onChange={(e) => updateStage(s.id, { probability: Number(e.target.value) })}
                  className="h-8 w-16 text-sm"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>

              <Select value={roleOf(s)} onValueChange={(v) => setRole(s, v as StageRole)}>
                <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={() => removeStage(s.id)}
                disabled={stages.length <= 1}
                className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                aria-label="Remove stage"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Segment triggers — configurable segment-entry actions */}
      <div className="rounded-xl bg-card p-5 shadow-card">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Segment Triggers</h3>
          <span className="text-xs text-muted-foreground">{watchedSegments.length} watched</span>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          When a customer enters a <strong>watched</strong> segment, an action is raised in the inbox.
        </p>
        <div className="space-y-2">
          {segments.map((seg) => {
            const watched = watchedSegments.includes(seg.id);
            return (
              <div key={seg.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{seg.name}</p>
                  <p className="text-xs text-muted-foreground">{seg.description}</p>
                </div>
                <button
                  onClick={() => toggleWatchedSegment(seg.id)}
                  aria-label={watched ? `Stop watching ${seg.name}` : `Watch ${seg.name}`}
                  className={cn("h-5 w-9 shrink-0 rounded-full transition-colors", watched ? "bg-success" : "bg-muted")}
                >
                  <div className={cn(
                    "h-4 w-4 translate-y-0.5 rounded-full bg-card shadow transition-transform",
                    watched ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Venues */}
        <div className="rounded-xl bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Venues / Units</h3>
            <Button variant="outline" size="sm">Add Venue</Button>
          </div>
          <div className="space-y-2">
            {VENUES.map((v) => (
              <div key={v} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                <span className="text-sm font-medium text-foreground">{v}</span>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Users */}
        <div className="rounded-xl bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Team Members</h3>
            <Button variant="outline" size="sm">Invite User</Button>
          </div>
          <div className="space-y-2">
            {USERS.map((u) => (
              <div key={u} className="flex items-center gap-3 rounded-lg border border-border px-4 py-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {u.split(" ").map((n) => n[0]).join("")}
                </div>
                <span className="flex-1 text-sm font-medium text-foreground">{u}</span>
                <Badge variant="secondary" className="text-xs">Venue User</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification settings */}
      <div className="rounded-xl bg-card p-5 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Notification Rules</h3>
        <div className="space-y-3">
          {[
            { label: "New enquiry received", desc: "Notify assigned user and venue manager", enabled: true },
            { label: "Unassigned after 30 minutes", desc: "Alert venue manager of unclaimed enquiries", enabled: true },
            { label: "Follow-up overdue", desc: "Remind owner when follow-up date passes", enabled: true },
            { label: "Deposit overdue", desc: "Alert when deposit not received within 7 days", enabled: false },
            { label: "Event in 7 days", desc: "Upcoming event reminder", enabled: true },
          ].map((rule) => (
            <div key={rule.label} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{rule.label}</p>
                <p className="text-xs text-muted-foreground">{rule.desc}</p>
              </div>
              <div className={cn("h-5 w-9 rounded-full transition-colors", rule.enabled ? "bg-success" : "bg-muted")}>
                <div className={cn(
                  "h-4 w-4 translate-y-0.5 rounded-full bg-card shadow transition-transform",
                  rule.enabled ? "translate-x-4" : "translate-x-0.5"
                )} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
