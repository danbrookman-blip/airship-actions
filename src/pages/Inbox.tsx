import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Clock,
  Inbox as InboxIcon,
  ChevronRight,
  CalendarClock,
  UserPlus,
  PoundSterling,
  Reply,
  CalendarDays,
  Sparkles,
  Plug,
  Zap,
  Cake,
  TrendingDown,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEnquiries } from "@/store/enquiries";
import {
  buildInboxActions,
  bucketActions,
  type InboxAction,
  type ActionTone,
} from "@/lib/inbox";

const KIND_ICON: Record<string, typeof Cake> = {
  sla_first_response: Reply,
  follow_up_overdue: CalendarClock,
  follow_up_due: CalendarClock,
  unassigned: UserPlus,
  deposit_chase: PoundSterling,
  event_approaching: CalendarDays,
  birthday_visit: Cake,
  sentiment_downgrade: TrendingDown,
  segment_entry: Users,
};

const TONE: Record<ActionTone, { chip: string; tile: string }> = {
  danger: { chip: "bg-destructive/10 text-destructive", tile: "bg-destructive/10 text-destructive" },
  warning: { chip: "bg-warning/10 text-warning", tile: "bg-warning/10 text-warning" },
  info: { chip: "bg-info/10 text-info", tile: "bg-info/10 text-info" },
  success: { chip: "bg-success/10 text-success", tile: "bg-success/10 text-success" },
  brand: { chip: "bg-accent/10 text-accent", tile: "bg-accent/10 text-accent" },
};

function relativeDue(iso: string): string {
  const diffH = (new Date(iso).getTime() - Date.now()) / 36e5;
  const abs = Math.abs(diffH);
  const unit = abs < 48 ? `${Math.round(abs)}h` : `${Math.round(abs / 24)}d`;
  return diffH < 0 ? `${unit} ago` : `in ${unit}`;
}

function ActionRow({ action, onOpen }: { action: InboxAction; onOpen: () => void }) {
  const Icon = KIND_ICON[action.kind] ?? InboxIcon;
  const tone = TONE[action.tagTone];

  return (
    <button
      onClick={onOpen}
      className="group flex w-full items-center gap-4 rounded-xl bg-card p-4 text-left shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5"
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tone.tile)}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{action.title}</span>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", tone.chip)}>
            {action.tag}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{action.reason}</p>
      </div>

      <div className="hidden w-44 shrink-0 items-center gap-2 sm:flex">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold uppercase text-primary-foreground">
          {action.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium text-foreground">{action.subjectName}</p>
          <p className="truncate text-[11px] text-muted-foreground">{action.subjectMeta}</p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        {action.dueAt && (
          <p className={cn("text-[12px] font-semibold", action.severity === "overdue" ? "text-destructive" : "text-muted-foreground")}>
            {relativeDue(action.dueAt)}
          </p>
        )}
        {action.value != null && (
          <p className="text-[11px] font-medium text-foreground">£{action.value.toLocaleString()}</p>
        )}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function Lane({
  title,
  icon: Icon,
  accent,
  actions,
  onOpen,
}: {
  title: string;
  icon: typeof Cake;
  accent: string;
  actions: InboxAction[];
  onOpen: (a: InboxAction) => void;
}) {
  if (actions.length === 0) return null;
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", accent)} />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {actions.length}
        </span>
      </div>
      <div className="space-y-2">
        {actions.map((a) => (
          <ActionRow key={a.id} action={a} onOpen={() => onOpen(a)} />
        ))}
      </div>
    </section>
  );
}

export default function Inbox() {
  const navigate = useNavigate();
  const { enquiries, stages, customers, segments, watchedSegments, groups, source, simulateInbound } = useEnquiries();

  const { buckets, total } = useMemo(() => {
    const actions = buildInboxActions(enquiries, stages, customers, watchedSegments, segments, new Date());
    return { buckets: bucketActions(actions), total: actions.length };
  }, [enquiries, stages, customers, watchedSegments, segments]);

  const openAction = (a: InboxAction) => {
    if (a.link) navigate(a.link);
    else if (a.hint) toast(a.title, { description: a.hint });
  };

  const handleSimulate = () => {
    const e = simulateInbound();
    if (e) {
      toast.success("New submission received", {
        description: `${e.firstName} ${e.lastName} · ${e.airshipGroup}`,
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 lg:px-8">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            Actions
            <Sparkles className="h-4 w-4 text-accent" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Tasks the platform surfaced for you — enquiries, SLAs, follow-ups, birthdays and at-risk customers.
          </p>
          {groups.length > 0 && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <Plug className="h-3 w-3" />
              Listening to {groups.length} Airship {groups.length === 1 ? "group" : "groups"}: {groups.map((g) => g.name).join(" · ")}
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                  source === "live" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                )}
              >
                {source === "live" ? "Live" : "Sample data"}
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {buckets.overdue.length > 0 && (
            <span className="rounded-full bg-destructive/10 px-3 py-1 font-semibold text-destructive">
              {buckets.overdue.length} overdue
            </span>
          )}
          {buckets.dueSoon.length > 0 && (
            <span className="rounded-full bg-warning/10 px-3 py-1 font-semibold text-warning">
              {buckets.dueSoon.length} due soon
            </span>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleSimulate}>
            <Zap className="h-3.5 w-3.5" /> Simulate inbound
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-6 p-6 lg:p-8">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 text-center shadow-card">
            <InboxIcon className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Inbox zero</p>
            <p className="text-[12.5px] text-muted-foreground">No actions need your attention right now.</p>
          </div>
        ) : (
          <>
            <Lane title="Overdue" icon={AlertCircle} accent="text-destructive" actions={buckets.overdue} onOpen={openAction} />
            <Lane title="Due soon" icon={Clock} accent="text-warning" actions={buckets.dueSoon} onOpen={openAction} />
            <Lane title="Needs attention" icon={InboxIcon} accent="text-info" actions={buckets.attention} onOpen={openAction} />
          </>
        )}
      </div>
    </div>
  );
}
