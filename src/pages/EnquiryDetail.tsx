import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Mail, Phone, Building2, CalendarDays, Users, PoundSterling,
  Clock, CheckCircle2, AlertCircle, RefreshCw, Globe, Mic, Bot, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MOCK_ACTIVITIES, EVENT_TYPE_LABELS, SOURCE_LABELS,
  type SourceType,
} from "@/data/mockData";
import { useEnquiries } from "@/store/enquiries";
import { findStage, stageColor, stageLabel } from "@/lib/stages";

const SYNC_STATUS = {
  synced: { label: "Synced", icon: CheckCircle2, className: "text-success" },
  pending: { label: "Pending", icon: RefreshCw, className: "text-warning" },
  not_synced: { label: "Not Synced", icon: AlertCircle, className: "text-muted-foreground" },
  error: { label: "Error", icon: AlertCircle, className: "text-destructive" },
};

const ACTIVITY_ICONS = {
  note: Pencil, call: Phone, email: Mail, stage_change: RefreshCw, assignment: Users, task: CheckCircle2,
};

export default function EnquiryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enquiries, stages, setStage } = useEnquiries();
  const enquiry = enquiries.find((e) => e.id === id);

  if (!enquiry) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Enquiry not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/pipeline")}>Back to Pipeline</Button>
        </div>
      </div>
    );
  }

  const sync = SYNC_STATUS[enquiry.airshipSyncStatus];
  const SyncIcon = sync.icon;
  const activities = MOCK_ACTIVITIES.filter((a) => a.enquiryId === enquiry.id);
  const eventDate = new Date(enquiry.requestedDate);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 lg:px-8">
        <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">{enquiry.firstName} {enquiry.lastName}</h1>
          <Badge className="border-transparent text-xs text-white" style={{ backgroundColor: stageColor(stages, enquiry.stage) }}>{stageLabel(stages, enquiry.stage)}</Badge>
          <span className="text-lg font-bold text-accent">£{enquiry.estimatedValue.toLocaleString()}</span>
          <div className={cn("ml-auto flex items-center gap-1 text-xs font-medium", sync.className)}>
            <SyncIcon className="h-3.5 w-3.5" />
            Airship: {sync.label}
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{enquiry.id} · {EVENT_TYPE_LABELS[enquiry.eventType]} · {SOURCE_LABELS[enquiry.source]}</p>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-3 lg:p-8">
        {/* Left: Contact + Event */}
        <div className="space-y-5">
          <div className="rounded-xl bg-card p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Contact Details</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{enquiry.email}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{enquiry.phone}</div>
              {enquiry.companyName && <div className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-4 w-4" />{enquiry.companyName}</div>}
            </div>
          </div>

          <div className="rounded-xl bg-card p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Event Details</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium text-foreground">{EVENT_TYPE_LABELS[enquiry.eventType]}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Occasion</span><span className="font-medium text-foreground">{enquiry.occasionType}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Venue</span><span className="font-medium text-foreground">{enquiry.venue}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium text-foreground">{eventDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium text-foreground">{enquiry.requestedTime}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Guests</span><span className="font-medium text-foreground">{enquiry.guestCount}</span></div>
            </div>
          </div>
        </div>

        {/* Centre: Timeline */}
        <div className="rounded-xl bg-card p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Activity Timeline</h3>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((act) => {
                const ActIcon = ACTIVITY_ICONS[act.type] || Pencil;
                return (
                  <div key={act.id} className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                      <ActIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{act.content}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{act.user} · {new Date(act.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No activity yet</p>
          )}
        </div>

        {/* Right: Quick info */}
        <div className="space-y-5">
          <div className="rounded-xl bg-card p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Sales Info</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="font-medium text-foreground">{enquiry.assignedTo || "Unassigned"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Probability</span><span className="font-medium text-foreground">{enquiry.probability}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Value</span><span className="font-bold text-accent">£{enquiry.estimatedValue.toLocaleString()}</span></div>
              {enquiry.depositAmount && (
                <div className="flex justify-between"><span className="text-muted-foreground">Deposit</span><span className="font-medium text-foreground">£{enquiry.depositAmount.toLocaleString()} ({enquiry.depositStatus})</span></div>
              )}
              {enquiry.nextFollowUp && (
                <div className="flex justify-between"><span className="text-muted-foreground">Next Follow-up</span><span className="font-medium text-foreground">{new Date(enquiry.nextFollowUp).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-card p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline">Log Call</Button>
              <Button size="sm" variant="outline">Add Note</Button>
              <Button size="sm" variant="outline">Send Menu</Button>
              <Button size="sm" variant="outline">Set Task</Button>
            </div>
            <div className="mt-3 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Move to stage</label>
              <Select value={findStage(stages, enquiry.stage)?.id ?? enquiry.stage} onValueChange={(v) => setStage(enquiry.id, v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
