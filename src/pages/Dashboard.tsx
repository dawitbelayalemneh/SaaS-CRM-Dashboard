import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Trophy, XCircle, DollarSign, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";

const STAGE_COLORS: Record<string, string> = {
  new: "hsl(220, 70%, 50%)",
  contacted: "hsl(35, 90%, 55%)",
  negotiation: "hsl(280, 60%, 55%)",
  won: "hsl(150, 60%, 40%)",
  lost: "hsl(0, 72%, 51%)",
};

const STATUS_COLORS: Record<string, string> = {
  new: "hsl(220, 70%, 50%)",
  contacted: "hsl(35, 90%, 55%)",
  qualified: "hsl(150, 60%, 40%)",
  lost: "hsl(0, 72%, 51%)",
};

type Deal = { id: string; value: number | null; stage: string; created_at: string };
type Lead = { id: string; status: string };

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contactCount, setContactCount] = useState(0);

  useEffect(() => {
    async function fetchAll() {
      const [leadsRes, contactsRes, dealsRes] = await Promise.all([
        supabase.from("leads").select("id, status"),
        supabase.from("contacts").select("id"),
        supabase.from("deals").select("id, value, stage, created_at"),
      ]);
      setLeads(leadsRes.data || []);
      setContactCount((contactsRes.data || []).length);
      setDeals(dealsRes.data || []);
    }
    fetchAll();
  }, []);

  // Metrics
  const totalLeads = leads.length;
  const dealsWon = deals.filter((d) => d.stage === "won");
  const dealsLost = deals.filter((d) => d.stage === "lost");
  const totalRevenue = dealsWon.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const closedDeals = dealsWon.length + dealsLost.length;
  const conversionRate = closedDeals > 0 ? Math.round((dealsWon.length / closedDeals) * 100) : 0;

  // Leads by Status chart
  const statusMap: Record<string, number> = {};
  leads.forEach((l) => { statusMap[l.status] = (statusMap[l.status] || 0) + 1; });
  const leadsByStatus = Object.entries(statusMap).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count,
    fill: STATUS_COLORS[name] || "hsl(220, 15%, 60%)",
  }));

  // Deals by Stage chart
  const stageMap: Record<string, number> = {};
  deals.forEach((d) => { stageMap[d.stage] = (stageMap[d.stage] || 0) + 1; });
  const dealsByStage = Object.entries(stageMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: STAGE_COLORS[name] || "hsl(220, 15%, 60%)",
  }));

  // Monthly Revenue chart (last 6 months)
  const monthlyRevenue = (() => {
    const months: { month: string; revenue: number; deals: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthLabel = format(date, "MMM yyyy");
      const monthDeals = dealsWon.filter((d) => {
        const created = new Date(d.created_at);
        return created.getMonth() === monthStart.getMonth() && created.getFullYear() === monthStart.getFullYear();
      });
      months.push({
        month: format(date, "MMM"),
        revenue: monthDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
        deals: monthDeals.length,
      });
    }
    return months;
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your CRM analytics at a glance.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Leads" value={totalLeads} icon={Users} />
          <StatCard title="Deals Won" value={dealsWon.length} icon={Trophy} trend="up" change={`${conversionRate}% win rate`} />
          <StatCard title="Deals Lost" value={dealsLost.length} icon={XCircle} trend={dealsLost.length > 0 ? "down" : "neutral"} />
          <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} trend="up" />
          <StatCard title="Conversion Rate" value={`${conversionRate}%`} icon={TrendingUp} trend={conversionRate >= 50 ? "up" : conversionRate > 0 ? "neutral" : "neutral"} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Leads by Status</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {leadsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220 15% 90%)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {leadsByStatus.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No lead data yet</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deals by Stage</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {dealsByStage.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dealsByStage}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      dataKey="value"
                      paddingAngle={3}
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {dealsByStage.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No deals yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                <Tooltip
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220 15% 90%)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(220, 70%, 50%)"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
