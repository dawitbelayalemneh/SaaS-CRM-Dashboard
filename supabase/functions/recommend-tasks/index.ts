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

    const { leadId } = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch data scoped to user
    const [leadsRes, dealsRes, activitiesRes] = await Promise.all([
      leadId
        ? supabase.from("leads").select("*").eq("id", leadId).single()
        : supabase.from("leads").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("deals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("activities").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
    ]);

    const leadsData = leadId ? (leadsRes.data ? [leadsRes.data] : []) : (leadsRes.data || []);
    const dealsData = dealsRes.data || [];
    const activitiesData = activitiesRes.data || [];

    const context = leadId ? "single lead" : "dashboard overview";

    const prompt = `You are a smart CRM task planner. Based on the following CRM data, recommend 3-5 specific, actionable tasks the sales team should do next.

Context: ${context}

Leads:
${JSON.stringify(leadsData.map(l => ({
  id: l.id, name: l.name, company: l.company, status: l.status,
  source: l.source, score: l.lead_score, notes: l.notes,
  created: l.created_at, updated: l.updated_at,
})))}

Deals:
${JSON.stringify(dealsData.map(d => ({
  title: d.title, stage: d.stage, value: d.value,
  close_date: d.expected_close_date, notes: d.notes,
})))}

Recent activities:
${JSON.stringify(activitiesData.slice(0, 15).map(a => ({
  action: a.action, type: a.entity_type, name: a.entity_name,
  details: a.details, date: a.created_at,
})))}

Return ONLY valid JSON:
{
  "tasks": [
    {
      "title": "Short task title (under 10 words)",
      "description": "One sentence explaining why and how",
      "priority": "high" | "medium" | "low",
      "category": "follow-up" | "proposal" | "meeting" | "email" | "research" | "update",
      "related_to": "Name of lead or deal this relates to, or null"
    }
  ]
}

Rules:
- Be specific — reference actual lead/deal names
- Prioritize based on deal value, lead score, and recency
- If a lead hasn't been contacted recently, suggest follow-up
- If a deal is in negotiation, suggest sending a proposal or scheduling a call
- If there are no leads/deals, suggest prospecting tasks`;

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

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend-tasks error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
