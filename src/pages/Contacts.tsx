import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { logActivity } from "@/lib/logActivity";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Eye, ArrowLeft, Mail, Phone, Building2, StickyNote, Calendar, DollarSign, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Deal = {
  id: string; title: string; value: number | null; stage: string;
  contact_id: string | null; expected_close_date: string | null;
};

type Contact = {
  id: string; name: string; email: string | null; phone: string | null;
  company: string | null; job_title: string | null; notes: string | null;
  created_at: string; updated_at: string;
};

const STAGE_COLORS: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  contacted: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  negotiation: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  won: "bg-success/10 text-success border-success/20",
  lost: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Contacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [viewing, setViewing] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", job_title: "", notes: "" });

  const fetchData = async () => {
    const [contactsRes, dealsRes] = await Promise.all([
      supabase.from("contacts").select("*").order("created_at", { ascending: false }),
      supabase.from("deals").select("id, title, value, stage, contact_id, expected_close_date"),
    ]);
    setContacts(contactsRes.data || []);
    setDeals(dealsRes.data || []);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredContacts = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((c) =>
      [c.name, c.email, c.company, c.phone, c.job_title].filter(Boolean).some((f) => f!.toLowerCase().includes(q))
    );
  }, [contacts, search]);

  const getContactDeals = (contactId: string) => deals.filter((d) => d.contact_id === contactId);

  const openNew = () => { setEditing(null); setForm({ name: "", email: "", phone: "", company: "", job_title: "", notes: "" }); setOpen(true); };
  const openEdit = (c: Contact) => { setEditing(c); setForm({ name: c.name, email: c.email || "", phone: c.phone || "", company: c.company || "", job_title: c.job_title || "", notes: c.notes || "" }); setOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (editing) {
      const { error } = await supabase.from("contacts").update(form).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Contact updated");
      await logActivity({ action: "Updated contact", entityType: "contact", entityId: editing.id, entityName: form.name });
      if (viewing?.id === editing.id) setViewing({ ...viewing!, ...form });
    } else {
      const { data, error } = await supabase.from("contacts").insert({ ...form, user_id: user!.id }).select("id").single();
      if (error) { toast.error(error.message); return; }
      toast.success("Contact created");
      await logActivity({ action: "Created new contact", entityType: "contact", entityId: data?.id, entityName: form.name });
    }
    setOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const contact = contacts.find((c) => c.id === id);
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Contact deleted");
    await logActivity({ action: "Deleted contact", entityType: "contact", entityId: id, entityName: contact?.name });
    if (viewing?.id === id) setViewing(null);
    fetchData();
  };

  const linkDealToContact = async (dealId: string, contactId: string) => {
    const { error } = await supabase.from("deals").update({ contact_id: contactId }).eq("id", dealId);
    if (error) { toast.error(error.message); return; }
    toast.success("Deal linked to contact");
    fetchData();
  };

  const unlinkDeal = async (dealId: string) => {
    const { error } = await supabase.from("deals").update({ contact_id: null }).eq("id", dealId);
    if (error) { toast.error(error.message); return; }
    toast.success("Deal unlinked");
    fetchData();
  };

  // Contact Details View
  if (viewing) {
    const contactDeals = getContactDeals(viewing.id);
    const unlinkedDeals = deals.filter((d) => !d.contact_id);
    const totalDealValue = contactDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-3xl">
          <Button variant="ghost" onClick={() => setViewing(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Contacts
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{viewing.name}</h1>
              {viewing.job_title && viewing.company && (
                <p className="text-muted-foreground mt-1 text-sm">{viewing.job_title} at {viewing.company}</p>
              )}
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

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4" /> Email</CardTitle>
              </CardHeader>
              <CardContent><p className="font-medium break-all">{viewing.email || "—"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</CardTitle>
              </CardHeader>
              <CardContent><p className="font-medium">{viewing.phone || "—"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4" /> Company</CardTitle>
              </CardHeader>
              <CardContent><p className="font-medium">{viewing.company || "—"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Created</CardTitle>
              </CardHeader>
              <CardContent><p className="font-medium">{format(new Date(viewing.created_at), "MMM d, yyyy")}</p></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><StickyNote className="h-4 w-4" /> Notes</CardTitle>
            </CardHeader>
            <CardContent><p className="whitespace-pre-wrap">{viewing.notes || "No notes added."}</p></CardContent>
          </Card>

          {/* Associated Deals */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4" /> Associated Deals</CardTitle>
                <p className="text-sm text-muted-foreground">${totalDealValue.toLocaleString()} total</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {contactDeals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No deals linked to this contact.</p>
              ) : (
                contactDeals.map((deal) => (
                  <div key={deal.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-3 gap-2">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{deal.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={STAGE_COLORS[deal.stage] || ""}>{deal.stage}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />{Number(deal.value || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => unlinkDeal(deal.id)} className="text-destructive text-xs self-end sm:self-auto">
                      Unlink
                    </Button>
                  </div>
                ))
              )}

              {unlinkedDeals.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Link an existing deal:</p>
                  <div className="flex flex-wrap gap-2">
                    {unlinkedDeals.slice(0, 5).map((deal) => (
                      <Button
                        key={deal.id}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => linkDealToContact(deal.id, viewing.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> {deal.title}
                      </Button>
                    ))}
                    {unlinkedDeals.length > 5 && (
                      <span className="text-xs text-muted-foreground self-center">+{unlinkedDeals.length - 5} more</span>
                    )}
                  </div>
                </div>
              )}
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
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground text-sm">{filteredContacts.length} {filteredContacts.length === 1 ? "contact" : "contacts"}</p>
          </div>
          <Button onClick={openNew} className="w-full sm:w-auto"><Plus className="mr-1 h-4 w-4" /> Add Contact</Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, company..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Deals</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {contacts.length === 0 ? "No contacts yet." : "No contacts match your search."}
                </TableCell></TableRow>
              ) : filteredContacts.map((c) => {
                const cd = getContactDeals(c.id);
                return (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setViewing(c)}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        {c.job_title && <p className="text-xs text-muted-foreground">{c.job_title}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.company}</TableCell>
                    <TableCell>
                      {cd.length > 0 ? (
                        <Badge variant="outline" className="text-xs">{cd.length} deal{cd.length > 1 ? "s" : ""}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => setViewing(c)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {filteredContacts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              {contacts.length === 0 ? "No contacts yet." : "No contacts match your search."}
            </div>
          ) : filteredContacts.map((c) => {
            const cd = getContactDeals(c.id);
            return (
              <Card key={c.id} className="cursor-pointer active:scale-[0.99] transition-transform" onClick={() => setViewing(c)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{c.name}</p>
                      {c.job_title && <p className="text-xs text-muted-foreground truncate">{c.job_title}</p>}
                      {c.company && <p className="text-xs text-muted-foreground truncate">{c.company}</p>}
                    </div>
                    {cd.length > 0 && (
                      <Badge variant="outline" className="shrink-0 text-xs">{cd.length} deal{cd.length > 1 ? "s" : ""}</Badge>
                    )}
                  </div>
                  {c.email && <p className="text-xs text-muted-foreground truncate mt-2">{c.email}</p>}
                  <div className="flex items-center justify-end mt-3 pt-3 border-t border-border/50">
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit Contact" : "Add Contact"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
                <div className="space-y-2"><Label>Job Title</Label><Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Add notes about this contact..." />
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"} Contact</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
