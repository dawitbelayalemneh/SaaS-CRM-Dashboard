import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Copy, Check, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
];

interface LeadEmailGeneratorProps {
  leadId: string;
  leadName: string;
  leadEmail: string | null;
}

export function LeadEmailGenerator({ leadId, leadName, leadEmail }: LeadEmailGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState("professional");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState<"subject" | "body" | "all" | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in"); return; }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ leadId, tone }),
      });

      const result = await resp.json();
      if (!resp.ok) { toast.error(result.error || "Failed to generate email"); return; }

      setSubject(result.subject);
      setBody(result.body);
    } catch {
      toast.error("Failed to generate email");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (!subject && !body) generate();
  };

  const copyToClipboard = async (text: string, type: "subject" | "body" | "all") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = () => {
    const full = `Subject: ${subject}\n\n${body}`;
    copyToClipboard(full, "all");
  };

  const mailtoLink = leadEmail
    ? `mailto:${leadEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen} className="gap-1">
        <Mail className="h-4 w-4" /> Generate Email
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI Email for {leadName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tone selector + regenerate */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={generate} disabled={loading} className="gap-1">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Generating..." : "Regenerate"}
              </Button>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Subject</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => copyToClipboard(subject, "subject")}
                  disabled={!subject}
                >
                  {copied === "subject" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === "subject" ? "Copied" : "Copy"}
                </Button>
              </div>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={loading ? "Generating subject..." : "Email subject"}
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Body</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => copyToClipboard(body, "body")}
                  disabled={!body}
                >
                  {copied === "body" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === "body" ? "Copied" : "Copy"}
                </Button>
              </div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={loading ? "Generating email body..." : "Email body"}
                rows={12}
                className="resize-y"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button onClick={copyAll} variant="outline" className="gap-1 flex-1" disabled={!subject && !body}>
                {copied === "all" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "all" ? "Copied!" : "Copy Full Email"}
              </Button>
              {mailtoLink && (
                <Button asChild className="gap-1 flex-1">
                  <a href={mailtoLink}>
                    <Mail className="h-4 w-4" /> Open in Email Client
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
