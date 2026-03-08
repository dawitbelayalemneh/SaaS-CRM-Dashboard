import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, UserCheck, DollarSign, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const STAGE_COLORS = ["hsl(220, 70%, 50%)", "hsl(165, 60%, 40%)", "hsl(280, 60%, 55%)", "hsl(35, 90%, 55%)", "hsl(0, 72%, 51%)"];

export default function Dashboard() {
  const [stats, setStats] = useState({ leads: 0, contacts: 0, deals: 0, totalValue: 0 });
  const [dealsByStage, setDealsByStage] = useState<{ name: string; value: number }[]>([]);
  const [leadsByStatus, setLeadsByStatus] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    async function fetchStats() {
      const [leadsRes, contactsRes, dealsRes] = await Promise.all([
        supabase.from("leads").select("id, status"),
        supabase.from("contacts").select("id"),
        supabase.from("deals").select("id, value, stage"),
      ]);

      const leads = leadsRes.data || [];
      const contacts = contactsRes.data || [];
      const deals = dealsRes.data || [];

      setStats({
        leads: leads.length,
        contacts: contacts.length,
        deals: deals.length,
        totalValue: deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
      });

      const stageMap: Record<string, number> = {};
      deals.forEach((d) => { stageMap[d.stage] = (stageMap[d.stage] || 0) + 1; });
      setDealsByStage(Object.entries(stageMap).map(([name, value]) => ({ name: name.replace("_", " "), value })));

      const statusMap: Record<string, number> = {};
      leads.forEach((l) => { statusMap[l.status] = (statusMap[l.status] || 0) + 1; });
      setLeadsByStatus(Object.entries(statusMap).map(([name, count]) => ({ name, count })));
    }
    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your CRM overview at a glance.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Leads" value={stats.leads} icon={Users} change="+12% this month" trend="up" />
          <StatCard title="Contacts" value={stats.contacts} icon={UserCheck} change="+5% this month" trend="up" />
          <StatCard title="Active Deals" value={stats.deals} icon={DollarSign} />
          <StatCard title="Pipeline Value" value={`$${stats.totalValue.toLocaleString()}`} icon={TrendingUp} change="+8% this month" trend="up" />
        </div>

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
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(220, 70%, 50%)" radius={[6, 6, 0, 0]} />
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
                    <Pie data={dealsByStage} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                      {dealsByStage.map((_, i) => (
                        <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No deals yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
