import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CalendarDays, Users, PoundSterling, Globe, Mail, Phone, Bot, Mic, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_LABELS, type Enquiry, type SourceType } from "@/data/mockData";
import { useEnquiries } from "@/store/enquiries";
import { activeStages, type Stage } from "@/lib/stages";
import NewEnquiryDialog from "@/components/NewEnquiryDialog";

const SOURCE_ICONS: Record<SourceType, typeof Globe> = {
  website: Globe, email: Mail, phone: Phone, voice_ai: Mic, chatbot: Bot, manual: Pencil,
};

/** Presentational card body — shared by the in-column card and the drag overlay. */
function CardBody({ enquiry, dragging }: { enquiry: Enquiry; dragging?: boolean }) {
  const SourceIcon = SOURCE_ICONS[enquiry.source];
  const eventDate = new Date(enquiry.requestedDate);
  return (
    <div
      className={cn(
        "rounded-lg bg-card p-3.5 shadow-card",
        dragging ? "rotate-1 shadow-card-hover ring-2 ring-accent/40" : "transition-all hover:shadow-card-hover hover:-translate-y-0.5"
      )}
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{enquiry.firstName} {enquiry.lastName}</p>
          <p className="text-xs text-muted-foreground">{EVENT_TYPE_LABELS[enquiry.eventType]}</p>
        </div>
        <SourceIcon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{enquiry.venue}</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{eventDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{enquiry.guestCount}</span>
        <span className="ml-auto font-semibold text-foreground">£{enquiry.estimatedValue.toLocaleString()}</span>
      </div>
      {enquiry.assignedTo && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {enquiry.assignedTo.split(" ").map(n => n[0]).join("")}
          </div>
          <span className="text-[11px] text-muted-foreground">{enquiry.assignedTo}</span>
        </div>
      )}
    </div>
  );
}

/** Draggable wrapper. A real drag (>8px) moves the card; a plain click opens it. */
function DraggableCard({ enquiry }: { enquiry: Enquiry }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: enquiry.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => navigate(`/enquiry/${enquiry.id}`)}
      className={cn("cursor-grab touch-none active:cursor-grabbing", isDragging && "opacity-40")}
    >
      <CardBody enquiry={enquiry} />
    </div>
  );
}

function Column({
  stage,
  enquiries,
}: {
  stage: Stage;
  enquiries: Enquiry[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const stageValue = enquiries.reduce((s, e) => s + e.estimatedValue, 0);

  return (
    <div className="flex w-[270px] flex-shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
        <h3 className="text-xs font-semibold text-foreground">{stage.label}</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{enquiries.length}</span>
      </div>
      {stageValue > 0 && (
        <p className="mb-2 text-[11px] font-medium text-muted-foreground">£{stageValue.toLocaleString()}</p>
      )}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2.5 rounded-lg p-2 transition-colors",
          isOver ? "bg-accent/10 ring-2 ring-accent/40" : "bg-muted/40"
        )}
      >
        {enquiries.map((e) => (
          <DraggableCard key={e.id} enquiry={e} />
        ))}
        {enquiries.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">Drop here</p>
        )}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const { enquiries, stages, setStage, addEnquiry } = useEnquiries();
  const [activeId, setActiveId] = useState<string | null>(null);
  const columns = activeStages(stages);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeEnquiry = enquiries.find((e) => e.id === activeId) ?? null;

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (e.over) setStage(String(e.active.id), String(e.over.id));
  };

  const activeIds = new Set(columns.map((s) => s.id));
  const openValue = enquiries
    .filter((e) => activeIds.has(e.stage))
    .reduce((s, e) => s + e.estimatedValue, 0);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground">Drag enquiries through your sales funnel</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <PoundSterling className="mr-1 inline h-3 w-3" />
            £{openValue.toLocaleString()} pipeline
          </span>
          <NewEnquiryDialog onAdd={addEnquiry} />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex-1 overflow-x-auto p-4 lg:p-6">
          <div className="flex gap-4" style={{ minWidth: columns.length * 280 }}>
            {columns.map((stage) => (
              <Column
                key={stage.id}
                stage={stage}
                enquiries={enquiries.filter((e) => e.stage === stage.id)}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeEnquiry ? (
            <div className="w-[254px]">
              <CardBody enquiry={activeEnquiry} dragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
