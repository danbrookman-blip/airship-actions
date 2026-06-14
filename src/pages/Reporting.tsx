import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { useEnquiries } from "@/store/enquiries";
import {
  dashboardStats, funnel, bySource, byVenue, leaderboard, monthlyRevenue, fmtGBP,
} from "@/lib/analytics";

const PIE_COLORS = ["hsl(205,100%,61%)", "hsl(283,75%,48%)", "hsl(94,55%,48%)", "hsl(45,100%,51%)", "hsl(340,70%,55%)", "hsl(170,65%,40%)"];

export default function Reporting() {
  const { enquiries, stages } = useEnquiries();

  const m = useMemo(() => ({
    stats: dashboardStats(enquiries, stages),
    funnel: funnel(enquiries, stages),
    revenue: monthlyRevenue(enquiries, stages),
    sources: bySource(enquiries),
    venues: byVenue(enquiries),
    leaders: leaderboard(enquiries, stages),
  }), [enquiries, stages]);

  const kpis = [
    { label: "Total Enquiries", value: m.stats.totalEnquiries },
    { label: "Pipeline Value", value: fmtGBP(m.stats.openPipelineValue) },
    { label: "Confirmed Value", value: fmtGBP(m.stats.confirmedValue) },
    { label: "Conversion Rate", value: `${m.stats.conversionRate}%` },
    { label: "Active Enquiries", value: m.stats.activeCount },
    { label: "Avg Booking Value", value: fmtGBP(m.stats.avgBookingValue) },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reporting</h1>
        <p className="text-sm text-muted-foreground">Sales funnel analytics and performance insights</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl bg-card p-4 shadow-card text-center">
            <p className="text-[11px] font-medium text-muted-foreground">{kpi.label}</p>
            <p className="mt-1 text-lg font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="rounded-xl bg-card p-5 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Sales Funnel</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={m.funnel} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(212,16%,46%)" allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(212,16%,46%)" width={150} />
            <Tooltip formatter={(v: number, name: string) => (name === "value" ? fmtGBP(v) : v)} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} name="Count">
              {m.funnel.map((row, i) => (
                <Cell key={i} fill={row.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

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
              <Line type="monotone" dataKey="pipeline" stroke="hsl(205,100%,61%)" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4 }} name="Pipeline" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Source breakdown */}
        <div className="rounded-xl bg-card p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Enquiries by Source</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={m.sources}>
              <XAxis dataKey="source" tick={{ fontSize: 12 }} stroke="hsl(212,16%,46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(212,16%,46%)" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(205,100%,61%)" radius={[6, 6, 0, 0]} barSize={36} name="Enquiries" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Venue pie */}
        <div className="rounded-xl bg-card p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Value by Venue</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={m.venues} dataKey="value" nameKey="venue" cx="50%" cy="50%" outerRadius={110} label={({ venue }) => venue} fontSize={11}>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 text-xs font-semibold text-muted-foreground">#</th>
                  <th className="pb-2 text-xs font-semibold text-muted-foreground">User</th>
                  <th className="pb-2 text-xs font-semibold text-muted-foreground text-right">Enquiries</th>
                  <th className="pb-2 text-xs font-semibold text-muted-foreground text-right">Value</th>
                  <th className="pb-2 text-xs font-semibold text-muted-foreground text-right">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {m.leaders.map((u, i) => (
                  <tr key={u.user} className="border-b border-border/50">
                    <td className="py-3 text-foreground font-medium">{i + 1}</td>
                    <td className="py-3 text-foreground">{u.user}</td>
                    <td className="py-3 text-right text-foreground">{u.enquiries}</td>
                    <td className="py-3 text-right font-medium text-foreground">{fmtGBP(u.value)}</td>
                    <td className="py-3 text-right font-semibold text-success">{u.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
