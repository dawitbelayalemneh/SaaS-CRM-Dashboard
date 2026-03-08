import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { logActivity } from "@/lib/logActivity";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Search, Eye, ArrowLeft, Calendar, Building2, Mail, Phone, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Lead = {
  id: string; name: string; email: string | null; phone: string | null;
  company: string | null; status: string; source: string | null; notes: string | null;
  created_at: string; updated_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  contacted: "bg-warning/10 text-warning border-warning/20",
  qualified: "bg-success/10 text-success border-success/20",
  lost: "bg-destructive/10 text-destructive border-destructive/20",
};

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "lost", label: "Lost" },
];

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [viewing, setViewing] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", status: "new", source: "", notes: "" });

  const fetchLeads = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads(data || []);
  };

  useEffect(() => { fetchLeads(); }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = search === "" || [lead.name, lead.email, lead.company, lead.phone, lead.source]
        .filter(Boolean).some((field) => field!.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const openNew = () => { setEditing(null); setForm({ name: "", email: "", phone: "", company: "", status: "new", source: "", notes: "" }); setOpen(true); };
  const openEdit = (lead: Lead) => { setEditing(lead); setForm({ name: lead.name, email: lead.email || "", phone: lead.phone || "", company: lead.company || "", status: lead.status, source: lead.source || "", notes: lead.notes || "" }); setOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (editing) {
      const { error } = await supabase.from("leads").update(form).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Lead updated");
      await logActivity({ action: "Updated lead", entityType: "lead", entityId: editing.id, entityName: form.name, details: `Status: ${form.status}` });
    } else {
      const { data, error } = await supabase.from("leads").insert({ ...form, user_id: user!.id }).select("id").single();
      if (error) { toast.error(error.message); return; }
      toast.success("Lead created");
      await logActivity({ action: "Created new lead", entityType: "lead", entityId: data?.id, entityName: form.name });
    }
    setOpen(false);
    fetchLeads();
  };

  const handleDelete = async (id: string) => {
    const lead = leads.find((l) => l.id === id);
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Lead deleted");
    await logActivity({ action: "Deleted lead", entityType: "lead", entityId: id, entityName: lead?.name });
    if (viewing?.id === id) setViewing(null);
    fetchLeads();
  };

  // Lead Details View
  if (viewing) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-3xl">
          <Button variant="ghost" onClick={() => setViewing(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Leads
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{viewing.name}</h1>
              <Badge variant="outline" className={`mt-2 ${STATUS_COLORS[viewing.status]}`}>{viewing.status}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { openEdit(viewing); }}>
                <Pencil className="mr-1 h-4 w-4" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(viewing.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </CardTitle>
              </CardHeader>
              <CardContent><p className="font-medium break-all">{viewing.email || "—"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Phone
                </CardTitle>
              </CardHeader>
              <CardContent><p className="font-medium">{viewing.phone || "—"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Company
                </CardTitle>
              </CardHeader>
              <CardContent><p className="font-medium">{viewing.company || "—"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Created
                </CardTitle>
              </CardHeader>
              <CardContent><p className="font-medium">{format(new Date(viewing.created_at), "MMM d, yyyy 'at' h:mm a")}</p></CardContent>
            </Card>
          </div>

          {viewing.source && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Source</CardTitle>
              </CardHeader>
              <CardContent><p>{viewing.source}</p></CardContent>
            </Card>
          )}

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground text-sm">Manage your sales leads · {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"}</p>
          </div>
          <Button onClick={openNew} className="w-full sm:w-auto"><Plus className="mr-1 h-4 w-4" /> Add Lead</Button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {leads.length === 0 ? "No leads yet. Add your first lead!" : "No leads match your filters."}
                  </TableCell>
                </TableRow>
              ) : filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer" onClick={() => setViewing(lead)}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.company}</TableCell>
                  <TableCell><Badge variant="outline" className={STATUS_COLORS[lead.status]}>{lead.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(lead.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => setViewing(lead)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(lead)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              {leads.length === 0 ? "No leads yet. Add your first lead!" : "No leads match your filters."}
            </div>
          ) : filteredLeads.map((lead) => (
            <Card key={lead.id} className="cursor-pointer active:scale-[0.99] transition-transform" onClick={() => setViewing(lead)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{lead.name}</p>
                    {lead.company && <p className="text-xs text-muted-foreground truncate">{lead.company}</p>}
                    {lead.email && <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.email}</p>}
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-xs ${STATUS_COLORS[lead.status]}`}>{lead.status}</Badge>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">{format(new Date(lead.created_at), "MMM d, yyyy")}</span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(lead)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(lead.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit Lead" : "Add Lead"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
                <div className="space-y-2"><Label>Source</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Add any notes about this lead..." />
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"} Lead</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
