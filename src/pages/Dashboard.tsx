import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Trophy, XCircle, DollarSign, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { TaskRecommendations } from "@/components/TaskRecommendations";
import { SalesInsightsCard } from "@/components/SalesInsightsCard";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";

const STAGE_COLORS: Record<string, string> = {
  new: "hsl(225, 65%, 52%)",
  contacted: "hsl(36, 90%, 54%)",
  negotiation: "hsl(270, 55%, 56%)",
  won: "hsl(152, 56%, 42%)",
  lost: "hsl(0, 72%, 51%)",
};

const STATUS_COLORS: Record<string, string> = {
  new: "hsl(225, 65%, 52%)",
  contacted: "hsl(36, 90%, 54%)",
  qualified: "hsl(152, 56%, 42%)",
  lost: "hsl(0, 72%, 51%)",
};

type Deal = { id: string; value: number | null; stage: string; created_at: string };
type Lead = { id: string; status: string };

const tooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid hsl(220 13% 91%)",
  boxShadow: "0 8px 24px -4px rgba(0,0,0,0.08), 0 2px 8px -2px rgba(0,0,0,0.04)",
  fontSize: "12px",
  padding: "8px 12px",
};

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

    // Real-time subscriptions
    const leadsChannel = supabase
      .channel('dashboard-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        supabase.from("leads").select("id, status").then(({ data }) => setLeads(data || []));
      })
      .subscribe();

    const contactsChannel = supabase
      .channel('dashboard-contacts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
        supabase.from("contacts").select("id").then(({ data }) => setContactCount((data || []).length));
      })
      .subscribe();

    const dealsChannel = supabase
      .channel('dashboard-deals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        supabase.from("deals").select("id, value, stage, created_at").then(({ data }) => setDeals(data || []));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(dealsChannel);
    };
  }, []);

  const totalLeads = leads.length;
  const dealsWon = deals.filter((d) => d.stage === "won");
  const dealsLost = deals.filter((d) => d.stage === "lost");
  const totalRevenue = dealsWon.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const closedDeals = dealsWon.length + dealsLost.length;
  const conversionRate = closedDeals > 0 ? Math.round((dealsWon.length / closedDeals) * 100) : 0;

  const statusMap: Record<string, number> = {};
  leads.forEach((l) => { statusMap[l.status] = (statusMap[l.status] || 0) + 1; });
  const leadsByStatus = Object.entries(statusMap).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count,
    fill: STATUS_COLORS[name] || "hsl(220, 15%, 60%)",
  }));

  const stageMap: Record<string, number> = {};
  deals.forEach((d) => { stageMap[d.stage] = (stageMap[d.stage] || 0) + 1; });
  const dealsByStage = Object.entries(stageMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: STAGE_COLORS[name] || "hsl(220, 15%, 60%)",
  }));

  const monthlyRevenue = (() => {
    const months: { month: string; revenue: number; deals: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
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
      <div className="space-y-8">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Your CRM analytics overview</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Leads" value={totalLeads} icon={Users} />
          <StatCard title="Deals Won" value={dealsWon.length} icon={Trophy} trend="up" change={`${conversionRate}% win rate`} />
          <StatCard title="Deals Lost" value={dealsLost.length} icon={XCircle} trend={dealsLost.length > 0 ? "down" : "neutral"} />
          <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} trend="up" />
          <StatCard title="Conversion" value={`${conversionRate}%`} icon={TrendingUp} />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Leads by Status</CardTitle>
              <CardDescription className="text-xs">Distribution of your current leads</CardDescription>
            </CardHeader>
            <CardContent className="h-72 pt-2">
              {leadsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsByStatus} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(220 14% 94% / 0.5)" }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {leadsByStatus.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No lead data yet</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Deals by Stage</CardTitle>
              <CardDescription className="text-xs">Pipeline distribution</CardDescription>
            </CardHeader>
            <CardContent className="h-72 pt-2">
              {dealsByStage.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dealsByStage} cx="50%" cy="50%" innerRadius={58} outerRadius={92} dataKey="value" paddingAngle={4} strokeWidth={0}
                      label={({ name, value }) => `${name} (${value})`} labelLine={{ strokeWidth: 1 }}>
                      {dealsByStage.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No deals yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Revenue</CardTitle>
            <CardDescription className="text-xs">Revenue from won deals over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(225, 65%, 52%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(225, 65%, 52%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(225, 65%, 52%)" strokeWidth={2.5} fill="url(#revenueGradient)" dot={{ r: 3, fill: "hsl(225, 65%, 52%)", strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(0 0% 100%)" }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Sales Insights */}
        <SalesInsightsCard />

        {/* AI Recommendations + Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TaskRecommendations variant="card" />

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Latest actions across your CRM</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ActivityTimeline limit={15} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
