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
import { Plus, Pencil, Trash2, Search, Eye, ArrowLeft, Calendar, Building2, Mail, Phone, StickyNote, Sparkles, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Pagination } from "@/components/Pagination";
import { LeadScoreBadge } from "@/components/LeadScoreBadge";
import { LeadInsights } from "@/components/LeadInsights";

const ITEMS_PER_PAGE = 10;

type Lead = {
  id: string; name: string; email: string | null; phone: string | null;
  company: string | null; status: string; source: string | null; notes: string | null;
  created_at: string; updated_at: string; lead_score: number | null;
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

const SORT_OPTIONS = [
  { value: "created_at", label: "Newest First" },
  { value: "score_desc", label: "Highest Score" },
  { value: "score_asc", label: "Lowest Score" },
  { value: "name", label: "Name A–Z" },
];

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [viewing, setViewing] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [currentPage, setCurrentPage] = useState(1);
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", status: "new", source: "", notes: "" });

  const fetchLeads = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads((data as Lead[]) || []);
  };

  useEffect(() => { fetchLeads(); }, []);

  const filteredLeads = useMemo(() => {
    const filtered = leads.filter((lead) => {
      const matchesSearch = search === "" || [lead.name, lead.email, lead.company, lead.phone, lead.source]
        .filter(Boolean).some((field) => field!.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "score_desc":
          return (b.lead_score ?? -1) - (a.lead_score ?? -1);
        case "score_asc":
          return (a.lead_score ?? 101) - (b.lead_score ?? 101);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [leads, search, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLeads.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, sortBy]);

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

  const handleScoreLead = async (leadId: string) => {
    setScoringId(leadId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in first"); return; }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/score-lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ leadId }),
      });

      const result = await resp.json();
      if (!resp.ok) {
        toast.error(result.error || "Failed to score lead");
        return;
      }

      toast.success(`Lead scored: ${result.score}/100 — ${result.reasoning}`);
      await fetchLeads();

      // Update viewing if applicable
      if (viewing?.id === leadId) {
        setViewing(prev => prev ? { ...prev, lead_score: result.score } : null);
      }
    } catch (e) {
      toast.error("Failed to score lead");
    } finally {
      setScoringId(null);
    }
  };

  const handleScoreAll = async () => {
    const unscored = leads.filter(l => l.lead_score === null);
    if (unscored.length === 0) { toast.info("All leads already scored"); return; }
    toast.info(`Scoring ${unscored.length} leads...`);
    for (const lead of unscored) {
      await handleScoreLead(lead.id);
    }
    toast.success("All leads scored!");
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
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className={STATUS_COLORS[viewing.status]}>{viewing.status}</Badge>
                <LeadScoreBadge score={viewing.lead_score} size="md" />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleScoreLead(viewing.id)}
                disabled={scoringId === viewing.id}
              >
                <Sparkles className="mr-1 h-4 w-4" />
                {scoringId === viewing.id ? "Scoring..." : viewing.lead_score ? "Re-score" : "AI Score"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEdit(viewing)}>
                <Pencil className="mr-1 h-4 w-4" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(viewing.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            </div>
          </div>

          {/* Score Card */}
          {viewing.lead_score !== null && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 text-primary font-bold text-xl">
                  {viewing.lead_score}
                </div>
                <div>
                  <p className="font-semibold text-sm">AI Conversion Score</p>
                  <p className="text-xs text-muted-foreground">
                    {viewing.lead_score >= 75 ? "High likelihood of conversion" :
                     viewing.lead_score >= 50 ? "Moderate conversion potential" :
                     viewing.lead_score >= 25 ? "Low conversion likelihood" :
                     "Very low conversion probability"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4" /> Email</CardTitle></CardHeader>
              <CardContent><p className="font-medium break-all">{viewing.email || "—"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</CardTitle></CardHeader>
              <CardContent><p className="font-medium">{viewing.phone || "—"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4" /> Company</CardTitle></CardHeader>
              <CardContent><p className="font-medium">{viewing.company || "—"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Created</CardTitle></CardHeader>
              <CardContent><p className="font-medium">{format(new Date(viewing.created_at), "MMM d, yyyy 'at' h:mm a")}</p></CardContent>
            </Card>
          </div>

          {viewing.source && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Source</CardTitle></CardHeader>
              <CardContent><p>{viewing.source}</p></CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><StickyNote className="h-4 w-4" /> Notes</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap">{viewing.notes || "No notes added."}</p></CardContent>
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
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleScoreAll} disabled={scoringId !== null} className="gap-1">
              <Sparkles className="h-4 w-4" /> Score All
            </Button>
            <Button onClick={openNew} className="flex-1 sm:flex-none"><Plus className="mr-1 h-4 w-4" /> Add Lead</Button>
          </div>
        </div>

        {/* Search, Filter & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, email, company..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-44">
              <div className="flex items-center gap-1"><ArrowUpDown className="h-3.5 w-3.5" /><SelectValue /></div>
            </SelectTrigger>
            <SelectContent>{SORT_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
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
                <TableHead>Score</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {leads.length === 0 ? "No leads yet. Add your first lead!" : "No leads match your filters."}
                  </TableCell>
                </TableRow>
              ) : paginatedLeads.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer" onClick={() => setViewing(lead)}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.company}</TableCell>
                  <TableCell><Badge variant="outline" className={STATUS_COLORS[lead.status]}>{lead.status}</Badge></TableCell>
                  <TableCell><LeadScoreBadge score={lead.lead_score} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(lead.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => handleScoreLead(lead.id)} disabled={scoringId === lead.id} title="AI Score">
                        <Sparkles className={`h-4 w-4 ${scoringId === lead.id ? "animate-spin" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setViewing(lead)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(lead)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredLeads.length} itemsPerPage={ITEMS_PER_PAGE} />
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {paginatedLeads.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              {leads.length === 0 ? "No leads yet. Add your first lead!" : "No leads match your filters."}
            </div>
          ) : paginatedLeads.map((lead) => (
            <Card key={lead.id} className="cursor-pointer active:scale-[0.99] transition-transform" onClick={() => setViewing(lead)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{lead.name}</p>
                    {lead.company && <p className="text-xs text-muted-foreground truncate">{lead.company}</p>}
                    {lead.email && <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.email}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[lead.status]}`}>{lead.status}</Badge>
                    <LeadScoreBadge score={lead.lead_score} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">{format(new Date(lead.created_at), "MMM d, yyyy")}</span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleScoreLead(lead.id)} disabled={scoringId === lead.id}>
                      <Sparkles className={`h-3.5 w-3.5 ${scoringId === lead.id ? "animate-spin" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(lead)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(lead.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredLeads.length} itemsPerPage={ITEMS_PER_PAGE} />
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
