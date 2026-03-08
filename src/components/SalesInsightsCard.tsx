import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, TrendingUp, Star, CheckCircle2, AlertTriangle, Lightbulb, BarChart3,
} from "lucide-react";
import { toast } from "sonner";

type SalesInsights = {
  summary: string;
  top_leads: { name: string; reason: string }[];
  sales_trends: string[];
  deals_likely_to_close: { title: string; value: number; reason: string }[];
  deals_at_risk: { title: string; value: number; risk: string }[];
  recommendations: string[];
};

export function SalesInsightsCard() {
  const [insights, setInsights] = useState<SalesInsights | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in"); return; }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      const result = await resp.json();
      if (!resp.ok) { toast.error(result.error || "Failed to generate insights"); return; }
      setInsights(result);
    } catch {
      toast.error("Failed to generate sales insights");
    } finally {
      setLoading(false);
    }
  };

  if (!insights) {
    return (
      <Card className="border-dashed col-span-full">
        <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold">AI Sales Insights</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Get an AI-powered analysis of your sales performance, top leads, pipeline health, and strategic recommendations.
            </p>
          </div>
          <Button onClick={fetchInsights} disabled={loading} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {loading ? "Analyzing your CRM..." : "Generate Sales Insights"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="col-span-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> AI Sales Insights
        </h2>
        <Button variant="ghost" size="sm" onClick={fetchInsights} disabled={loading} className="gap-1 text-xs">
          <Sparkles className="h-3 w-3" /> {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Executive Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm leading-relaxed">{insights.summary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Leads */}
        {insights.top_leads.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" /> Top Performing Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {insights.top_leads.map((lead, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-muted/40">
                    <span className="text-warning font-bold text-sm mt-0.5">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sales Trends */}
        {insights.sales_trends.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Sales Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ul className="space-y-2">
                {insights.sales_trends.map((trend, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-0.5">→</span> {trend}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Deals Likely to Close */}
        {insights.deals_likely_to_close.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" /> Deals Likely to Close
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {insights.deals_likely_to_close.map((deal, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 p-2 rounded-md bg-muted/40">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{deal.title}</p>
                      <p className="text-xs text-muted-foreground">{deal.reason}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 bg-success/10 text-success border-success/20">
                      ${(deal.value || 0).toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deals at Risk */}
        {insights.deals_at_risk.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Deals at Risk
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {insights.deals_at_risk.map((deal, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 p-2 rounded-md bg-muted/40">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{deal.title}</p>
                      <p className="text-xs text-muted-foreground">{deal.risk}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 bg-destructive/10 text-destructive border-destructive/20">
                      ${(deal.value || 0).toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning" /> Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ul className="space-y-2">
              {insights.recommendations.map((rec, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-warning mt-0.5 font-bold">{i + 1}.</span> {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
