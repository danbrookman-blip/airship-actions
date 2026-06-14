import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Users, PoundSterling } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EVENT_TYPE_LABELS } from "@/data/mockData";
import { useEnquiries } from "@/store/enquiries";
import { stageColor } from "@/lib/stages";

type ViewMode = "month" | "week";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const { enquiries, stages } = useEnquiries();

  const calendarEvents = useMemo(
    () => enquiries.filter((e) => ["provisional", "deposit_requested", "deposit_paid", "confirmed", "completed"].includes(e.stage)),
    [enquiries]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const totalDays = lastDay.getDate();

  const days: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (days.length % 7 !== 0) days.push(null);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const getEventsForDay = (day: number) => {
    return calendarEvents.filter((e) => {
      const d = new Date(e.requestedDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground">Provisional and confirmed events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-foreground">
            {currentDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="pb-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px rounded-xl border border-border bg-border overflow-hidden">
          {days.map((day, i) => {
            const events = day ? getEventsForDay(day) : [];
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[110px] bg-card p-1.5",
                  !day && "bg-muted/30",
                  day && isToday(day) && "bg-accent/5"
                )}
              >
                {day && (
                  <>
                    <span className={cn(
                      "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday(day) ? "bg-accent text-accent-foreground" : "text-foreground"
                    )}>
                      {day}
                    </span>
                    <div className="space-y-1">
                      {events.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white truncate"
                          style={{ backgroundColor: stageColor(stages, e.stage) }}
                          title={`${e.firstName} ${e.lastName} - ${EVENT_TYPE_LABELS[e.eventType]} (${e.guestCount} guests, £${e.estimatedValue.toLocaleString()})`}
                        >
                          {e.firstName} {e.lastName[0]}. · £{(e.estimatedValue / 1000).toFixed(1)}k
                        </div>
                      ))}
                      {events.length > 2 && (
                        <p className="text-[10px] text-muted-foreground">+{events.length - 2} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Upcoming events list */}
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Upcoming Events</h3>
          <div className="space-y-2">
            {calendarEvents
              .filter((e) => new Date(e.requestedDate) >= today)
              .sort((a, b) => new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime())
              .slice(0, 5)
              .map((e) => (
                <div key={e.id} className="flex items-center gap-4 rounded-lg bg-card p-3 shadow-card">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stageColor(stages, e.stage) }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{e.firstName} {e.lastName} — {EVENT_TYPE_LABELS[e.eventType]}</p>
                    <p className="text-xs text-muted-foreground">{e.venue} · {new Date(e.requestedDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.guestCount}</span>
                    <span className="font-semibold text-foreground">£{e.estimatedValue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
