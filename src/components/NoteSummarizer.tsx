import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, FileText, CheckCircle2, ListChecks, Target } from "lucide-react";
import { toast } from "sonner";

type NoteSummary = {
  summary: string;
  key_points: string[];
  decisions: string[];
  action_items: string[];
};

export function NoteSummarizer({ notes }: { notes: string | null }) {
  const [summary, setSummary] = useState<NoteSummary | null>(null);
  const [loading, setLoading] = useState(false);

  if (!notes || notes.trim().length < 10) return null;

  const summarize = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in"); return; }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/summarize-notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ notes }),
      });

      const result = await resp.json();
      if (!resp.ok) { toast.error(result.error || "Failed to summarize"); return; }
      setSummary(result);
    } catch {
      toast.error("Failed to summarize notes");
    } finally {
      setLoading(false);
    }
  };

  if (!summary) {
    return (
      <Button variant="outline" size="sm" onClick={summarize} disabled={loading} className="gap-1 mt-2">
        <Sparkles className="h-3.5 w-3.5" />
        {loading ? "Summarizing..." : "AI Summarize"}
      </Button>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Summary
        </h4>
        <Button variant="ghost" size="sm" onClick={summarize} disabled={loading} className="h-7 text-xs gap-1">
          <Sparkles className="h-3 w-3" /> {loading ? "..." : "Refresh"}
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <p className="text-sm">{summary.summary}</p>
        </CardContent>
      </Card>

      {summary.key_points.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" /> Key Points
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <ul className="space-y-1">
              {summary.key_points.map((p, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span> {p}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {summary.decisions.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Decisions Made
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <ul className="space-y-1">
              {summary.decisions.map((d, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span> {d}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {summary.action_items.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Action Items
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <ul className="space-y-1">
              {summary.action_items.map((a, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-warning mt-0.5">→</span> {a}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
