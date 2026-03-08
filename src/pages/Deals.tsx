import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { logActivity } from "@/lib/logActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, ArrowLeft, Calendar, Building2, StickyNote, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

type Deal = {
  id: string; title: string; value: number | null; stage: string;
  contact_id: string | null; expected_close_date: string | null; notes: string | null;
  created_at: string; updated_at: string;
};

const STAGES = [
  { value: "new", label: "New", color: "bg-primary/10 border-primary/30", headerColor: "text-primary", dot: "bg-primary" },
  { value: "contacted", label: "Contacted", headerColor: "text-chart-4", color: "bg-chart-4/10 border-chart-4/30", dot: "bg-chart-4" },
  { value: "negotiation", label: "Negotiation", headerColor: "text-chart-3", color: "bg-chart-3/10 border-chart-3/30", dot: "bg-chart-3" },
  { value: "won", label: "Won", headerColor: "text-success", color: "bg-success/10 border-success/30", dot: "bg-success" },
  { value: "lost", label: "Lost", headerColor: "text-destructive", color: "bg-destructive/10 border-destructive/30", dot: "bg-destructive" },
];

export default function Deals() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [viewing, setViewing] = useState<Deal | null>(null);
  const [form, setForm] = useState({ title: "", value: "", stage: "new", expected_close_date: "", notes: "" });

  const fetchDeals = async () => {
    const { data } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
    setDeals(data || []);
  };

  useEffect(() => { fetchDeals(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", value: "", stage: "new", expected_close_date: "", notes: "" });
    setOpen(true);
  };

  const openEdit = (deal: Deal) => {
    setEditing(deal);
    setForm({
      title: deal.title,
      value: deal.value?.toString() || "",
      stage: deal.stage,
      expected_close_date: deal.expected_close_date || "",
      notes: deal.notes || "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const payload = {
      title: form.title,
      value: form.value ? parseFloat(form.value) : 0,
      stage: form.stage,
      expected_close_date: form.expected_close_date || null,
      notes: form.notes || null,
    };
    if (editing) {
      const { error } = await supabase.from("deals").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Deal updated");
      await logActivity({ action: "Updated deal", entityType: "deal", entityId: editing.id, entityName: form.title });
      if (viewing?.id === editing.id) {
        setViewing({ ...viewing!, ...payload, value: payload.value });
      }
    } else {
      const { data, error } = await supabase.from("deals").insert({ ...payload, user_id: user!.id }).select("id").single();
      if (error) { toast.error(error.message); return; }
      toast.success("Deal created");
      await logActivity({ action: "Created new deal", entityType: "deal", entityId: data?.id, entityName: form.title, details: `Value: $${payload.value?.toLocaleString() || 0}` });
    }
    setOpen(false);
    fetchDeals();
  };

  const handleDelete = async (id: string) => {
    const deal = deals.find((d) => d.id === id);
    const { error } = await supabase.from("deals").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deal deleted");
    await logActivity({ action: "Deleted deal", entityType: "deal", entityId: id, entityName: deal?.title });
    if (viewing?.id === id) setViewing(null);
    fetchDeals();
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const newStage = result.destination.droppableId;
    const dealId = result.draggableId;
    if (newStage === result.source.droppableId) return;

    const deal = deals.find((d) => d.id === dealId);
    const oldStageLabel = STAGES.find((s) => s.value === result.source.droppableId)?.label;
    const newStageLabel = STAGES.find((s) => s.value === newStage)?.label;

    // Optimistic update
    setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, stage: newStage } : d));

    const { error } = await supabase.from("deals").update({ stage: newStage }).eq("id", dealId);
    if (error) {
      toast.error("Failed to update deal stage");
      fetchDeals();
    } else {
      toast.success(`Deal moved to ${newStageLabel}`);
      await logActivity({ action: "Deal stage changed", entityType: "deal", entityId: dealId, entityName: deal?.title, details: `${oldStageLabel} → ${newStageLabel}` });
    }
  };

  const getStage = (value: string) => STAGES.find((s) => s.value === value) || STAGES[0];

  // Deal Details View
  if (viewing) {
    const stageInfo = getStage(viewing.stage);
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-3xl">
          <Button variant="ghost" onClick={() => setViewing(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Pipeline
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{viewing.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={stageInfo.color}>{stageInfo.label}</Badge>
                <span className="text-2xl font-bold text-primary">${Number(viewing.value || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEdit(viewing)}>
                <Pencil className="mr-1 h-4 w-4" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(viewing.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            </div>
          </div>

          {/* Stage Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Update Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {STAGES.map((s) => (
                  <Button
                    key={s.value}
                    size="sm"
                    variant={viewing.stage === s.value ? "default" : "outline"}
                    onClick={async () => {
                      const { error } = await supabase.from("deals").update({ stage: s.value }).eq("id", viewing.id);
                      if (error) { toast.error(error.message); return; }
                      setViewing({ ...viewing, stage: s.value });
                      fetchDeals();
                      toast.success(`Stage updated to ${s.label}`);
                    }}
                  >
                    <span className={`h-2 w-2 rounded-full mr-2 ${s.dot}`} />
                    {s.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Deal Value
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">${Number(viewing.value || 0).toLocaleString()}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Expected Close
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{viewing.expected_close_date ? format(new Date(viewing.expected_close_date), "MMM d, yyyy") : "—"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Created
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{format(new Date(viewing.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <StickyNote className="h-4 w-4" /> Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{viewing.notes || "No notes added."}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Deals Pipeline</h1>
            <p className="text-muted-foreground">Drag and drop deals between stages</p>
          </div>
          <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add Deal</Button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage.value);
              const total = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
              return (
                <div key={stage.value} className="flex-shrink-0 w-64">
                  <div className={`rounded-xl border ${stage.color} p-3 mb-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${stage.dot}`} />
                        <h3 className={`text-sm font-semibold ${stage.headerColor}`}>{stage.label}</h3>
                      </div>
                      <Badge variant="outline" className="text-xs">{stageDeals.length}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">${total.toLocaleString()}</p>
                  </div>

                  <Droppable droppableId={stage.value}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] rounded-xl p-2 transition-colors space-y-2 ${
                          snapshot.isDraggingOver ? "bg-primary/5 ring-2 ring-primary/20" : "bg-muted/30"
                        }`}
                      >
                        {stageDeals.map((deal, index) => (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`transition-shadow ${snapshot.isDragging ? "shadow-lg rotate-2" : ""}`}
                              >
                                <Card
                                  className="cursor-pointer hover:shadow-md transition-shadow border-border/60"
                                  onClick={() => setViewing(deal)}
                                >
                                  <CardContent className="p-4 space-y-2">
                                    <p className="font-medium text-sm leading-tight">{deal.title}</p>
                                    <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                                      <DollarSign className="h-3.5 w-3.5" />
                                      {Number(deal.value || 0).toLocaleString()}
                                    </div>
                                    {deal.expected_close_date && (
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(deal.expected_close_date), "MMM d, yyyy")}
                                      </p>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit Deal" : "Add Deal"}</DialogTitle></DialogHeader>
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
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Add notes about this deal..." />
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"} Deal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
