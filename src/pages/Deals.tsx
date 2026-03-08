import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign } from "lucide-react";
import { toast } from "sonner";

type Deal = {
  id: string; title: string; value: number | null; stage: string;
  contact_id: string | null; expected_close_date: string | null; notes: string | null;
};

const STAGES = [
  { value: "discovery", label: "Discovery", color: "bg-chart-1/10 text-chart-1 border-chart-1/20" },
  { value: "proposal", label: "Proposal", color: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
  { value: "negotiation", label: "Negotiation", color: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  { value: "closed_won", label: "Closed Won", color: "bg-success/10 text-success border-success/20" },
  { value: "closed_lost", label: "Closed Lost", color: "bg-destructive/10 text-destructive border-destructive/20" },
];

export default function Deals() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", value: "", stage: "discovery", expected_close_date: "", notes: "" });

  const fetchDeals = async () => {
    const { data } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
    setDeals(data || []);
  };

  useEffect(() => { fetchDeals(); }, []);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const payload = {
      title: form.title,
      value: form.value ? parseFloat(form.value) : 0,
      stage: form.stage,
      expected_close_date: form.expected_close_date || null,
      notes: form.notes || null,
      user_id: user!.id,
    };
    const { error } = await supabase.from("deals").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Deal created");
    setOpen(false);
    setForm({ title: "", value: "", stage: "discovery", expected_close_date: "", notes: "" });
    fetchDeals();
  };

  const updateStage = async (id: string, stage: string) => {
    const { error } = await supabase.from("deals").update({ stage }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetchDeals();
  };

  const getStageInfo = (stage: string) => STAGES.find((s) => s.value === stage) || STAGES[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Deals Pipeline</h1>
            <p className="text-muted-foreground">Track your deals through each stage</p>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> Add Deal</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage.value);
            const total = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
            return (
              <div key={stage.value} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{stage.label}</h3>
                  <Badge variant="outline" className="text-xs">{stageDeals.length}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">${total.toLocaleString()}</p>
                <div className="space-y-2">
                  {stageDeals.map((deal) => (
                    <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-2">
                        <p className="font-medium text-sm">{deal.title}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          {Number(deal.value || 0).toLocaleString()}
                        </div>
                        <Select value={deal.stage} onValueChange={(v) => updateStage(deal.id, v)}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Deal</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Value ($)</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Expected Close Date</Label><Input type="date" value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">Create Deal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
