import { NavLink, useLocation } from "react-router-dom";
import { useMemo } from "react";
import {
  LayoutDashboard,
  Columns3,
  Inbox,
  CalendarDays,
  BarChart3,
  Settings,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildInboxActions, bucketActions } from "@/lib/inbox";
import { useEnquiries } from "@/store/enquiries";

const navItems = [
  { to: "/", icon: Inbox, label: "Inbox" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/pipeline", icon: Columns3, label: "Pipeline" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/reporting", icon: BarChart3, label: "Reporting" },
  { to: "/admin", icon: Settings, label: "Admin" },
];

export default function AppSidebar() {
  const location = useLocation();
  const { enquiries, stages, customers, segments, watchedSegments } = useEnquiries();

  // Live count of agent-surfaced actions, driving the Inbox + Notifications badges.
  const { overdueCount, openCount } = useMemo(() => {
    const buckets = bucketActions(buildInboxActions(enquiries, stages, customers, watchedSegments, segments, new Date()));
    return {
      overdueCount: buckets.overdue.length,
      openCount: buckets.overdue.length + buckets.dueSoon.length + buckets.attention.length,
    };
  }, [enquiries, stages, customers, watchedSegments, segments]);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <img src={`${import.meta.env.BASE_URL}airship.svg`} alt="Airship" className="h-9 w-auto" />
        <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">Actions</span>
      </div>

      {/* Nav */}
      <nav className="mt-2 flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent font-semibold text-sidebar-primary shadow-pill"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-primary"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
              {item.to === "/" && overdueCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-destructive-foreground">
                  {overdueCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] text-sidebar-foreground transition-all hover:bg-sidebar-accent/60 hover:text-sidebar-primary">
          <Bell className="h-[18px] w-[18px]" />
          Notifications
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">{openCount}</span>
        </button>
      </div>
    </aside>
  );
}
