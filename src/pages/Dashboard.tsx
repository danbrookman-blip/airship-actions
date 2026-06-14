import { useMemo } from "react";
import {
  Inbox,
  TrendingUp,
  CheckCircle2,
  Layers,
  PoundSterling,
  AlertTriangle,
  BarChart3,
  Users,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import StatCard from "@/components/StatCard";
import { useEnquiries } from "@/store/enquiries";
import { buildInboxActions, bucketActions } from "@/lib/inbox";
import {
  dashboardStats, bySource, byVenue, leaderboard, monthlyRevenue, fmtGBP,
} from "@/lib/analytics";

const PIE_COLORS = ["hsl(205,100%,61%)", "hsl(283,75%,48%)", "hsl(94,55%,48%)", "hsl(45,100%,51%)", "hsl(340,70%,55%)", "hsl(170,65%,40%)"];

export default function Dashboard() {
  const { enquiries, stages, customers, segments, watchedSegments } = useEnquiries();

  const m = useMemo(() => {
    const now = new Date();
    const actions = buildInboxActions(enquiries, stages, customers, watchedSegments, segments, now);
    return {
      stats: dashboardStats(enquiries, stages),
      revenue: monthlyRevenue(enquiries, stages),
      sources: bySource(enquiries),
      venues: byVenue(enquiries),
      leaders: leaderboard(enquiries, stages),
      overdue: bucketActions(actions).overdue.length,
    };
  }, [enquiries, stages, customers, segments, watchedSegments]);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Event sales overview and performance</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Enquiries Today" value={m.stats.enquiriesToday} icon={Inbox} subtitle={`${m.stats.enquiriesThisWeek} this week`} />
        <StatCard title="Open Pipeline" value={fmtGBP(m.stats.openPipelineValue)} icon={TrendingUp} variant="accent" />
        <StatCard title="Confirmed Value" value={fmtGBP(m.stats.confirmedValue)} icon={CheckCircle2} variant="success" />
        <StatCard title="Conversion Rate" value={`${m.stats.conversionRate}%`} icon={BarChart3} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Enquiries" value={m.stats.activeCount} icon={Layers} />
        <StatCard title="Overdue Actions" value={m.overdue} icon={AlertTriangle} variant="warning" />
        <StatCard title="Deposit Outstanding" value={fmtGBP(m.stats.depositOutstanding)} icon={PoundSterling} />
        <StatCard title="This Month" value={m.stats.enquiriesThisMonth} subtitle="enquiries received" icon={Users} />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue trend */}
        <div className="rounded-xl bg-card p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Booked Revenue by Event Month</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={m.revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(206,22%,90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(212,16%,46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(212,16%,46%)" tickFormatter={(v) => `£${v / 1000}k`} />
              <Tooltip formatter={(v: number) => fmtGBP(v)} />
              <Line type="monotone" dataKey="confirmed" stroke="hsl(94,55%,48%)" strokeWidth={2.5} dot={{ r: 4 }} name="Confirmed" />
              <Line type="monotone" dataKey="pipeline" stroke="hsl(205,100%,61%)" strokeWidth={2.5} dot={{ r: 4 }} strokeDasharray="5 5" name="Pipeline" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* By Source */}
        <div className="rounded-xl bg-card p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Enquiries by Source</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={m.sources} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(212,16%,46%)" allowDecimals={false} />
              <YAxis type="category" dataKey="source" tick={{ fontSize: 12 }} stroke="hsl(212,16%,46%)" width={80} />
              <Tooltip formatter={(v: number) => v} />
              <Bar dataKey="count" fill="hsl(205,100%,61%)" radius={[0, 6, 6, 0]} barSize={24} name="Enquiries" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Venue */}
        <div className="rounded-xl bg-card p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Pipeline Value by Venue</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={m.venues} dataKey="value" nameKey="venue" cx="50%" cy="50%" outerRadius={100} label={({ venue, percent }) => `${venue} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {m.venues.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtGBP(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Leaderboard */}
        <div className="rounded-xl bg-card p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Team Leaderboard</h3>
          <div className="space-y-3">
            {m.leaders.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No assigned enquiries yet</p>
            )}
            {m.leaders.map((user, i) => (
              <div key={user.user} className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{user.user}</p>
                  <p className="text-xs text-muted-foreground">{user.enquiries} enquiries · {fmtGBP(user.value)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-success">{user.conversionRate}%</p>
                  <p className="text-[11px] text-muted-foreground">conversion</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
