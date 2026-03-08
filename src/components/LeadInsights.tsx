import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Target, MessageSquare, ShieldCheck, AlertTriangle, Lightbulb } from "lucide-react";
import { toast } from "sonner";

type Insights = {
  conversion_likelihood: string;
  recommended_action: string;
  follow_up_strategy: string;
  strengths: string[];
  risks: string[];
  talking_points: string[];
};

export function LeadInsights({ leadId }: { leadId: string }) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in"); return; }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ leadId }),
      });

      const result = await resp.json();
      if (!resp.ok) { toast.error(result.error || "Failed to generate insights"); return; }
      setInsights(result);
    } catch {
      toast.error("Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  if (!insights) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">AI Insights</p>
            <p className="text-xs text-muted-foreground mt-1">Get AI-powered analysis of this lead's conversion potential, recommended actions, and follow-up strategy.</p>
          </div>
          <Button onClick={fetchInsights} disabled={loading} variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {loading ? "Analyzing..." : "Generate Insights"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Insights</h3>
        <Button variant="ghost" size="sm" onClick={fetchInsights} disabled={loading} className="text-xs gap-1">
          <Sparkles className="h-3 w-3" /> {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Conversion Likelihood
          </CardTitle>
        </CardHeader>
        <CardContent><p className="text-sm">{insights.conversion_likelihood}</p></CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-warning" /> Recommended Next Action
          </CardTitle>
        </CardHeader>
        <CardContent><p className="text-sm">{insights.recommended_action}</p></CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-success" /> Follow-Up Strategy
          </CardTitle>
        </CardHeader>
        <CardContent><p className="text-sm">{insights.follow_up_strategy}</p></CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" /> Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {insights.strengths.map((s, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span> {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {insights.risks.map((r, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-destructive mt-0.5">!</span> {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning" /> Talking Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {insights.talking_points.map((t, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span> {t}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
