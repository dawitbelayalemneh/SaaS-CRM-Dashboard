import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase config missing");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabaseUser = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [leadsRes, dealsRes, activitiesRes] = await Promise.all([
      supabase.from("leads").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("deals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("activities").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(40),
    ]);

    const leads = leadsRes.data || [];
    const deals = dealsRes.data || [];
    const activities = activitiesRes.data || [];

    const prompt = `You are an expert sales analyst AI. Analyze this CRM data and produce actionable sales insights for a dashboard.

Leads (${leads.length} total):
${JSON.stringify(leads.map(l => ({
  name: l.name, company: l.company, status: l.status, score: l.lead_score,
  source: l.source, created: l.created_at, updated: l.updated_at,
})))}

Deals (${deals.length} total):
${JSON.stringify(deals.map(d => ({
  title: d.title, stage: d.stage, value: d.value,
  close_date: d.expected_close_date, created: d.created_at, updated: d.updated_at,
})))}

Recent activities (${activities.length}):
${JSON.stringify(activities.slice(0, 20).map(a => ({
  action: a.action, type: a.entity_type, name: a.entity_name, date: a.created_at,
})))}

Today's date: ${new Date().toISOString().split("T")[0]}

Return ONLY valid JSON:
{
  "summary": "2-3 sentence executive summary of sales health",
  "top_leads": [
    { "name": "Lead name", "reason": "Why they're a top lead (1 sentence)" }
  ],
  "sales_trends": [
    "Trend observation 1",
    "Trend observation 2"
  ],
  "deals_likely_to_close": [
    { "title": "Deal title", "value": 1000, "reason": "Why it's likely to close" }
  ],
  "deals_at_risk": [
    { "title": "Deal title", "value": 1000, "risk": "What the risk is" }
  ],
  "recommendations": [
    "Strategic recommendation 1",
    "Strategic recommendation 2"
  ]
}

Rules:
- If data is sparse, still provide useful observations about what's missing or what to focus on
- Keep each item concise
- top_leads: max 3, based on score, status, recency
- deals_likely_to_close: max 3, deals in negotiation/contacted with high values or close dates approaching
- deals_at_risk: max 3, stale deals, lost trends, or deals without recent activity
- sales_trends: max 3, patterns in lead sources, conversion, pipeline velocity
- recommendations: max 3, strategic next steps`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse AI response");

    return new Response(jsonMatch[0], {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sales-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
