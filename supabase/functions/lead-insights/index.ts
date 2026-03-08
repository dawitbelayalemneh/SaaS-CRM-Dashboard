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

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabaseUser = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { leadId } = await req.json();
    if (!leadId) throw new Error("leadId is required");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: lead, error: leadError } = await supabase.from("leads").select("*").eq("id", leadId).single();
    if (leadError || !lead) throw new Error("Lead not found");

    const { data: activities } = await supabase
      .from("activities")
      .select("action, entity_type, details, created_at")
      .eq("entity_id", leadId)
      .order("created_at", { ascending: false })
      .limit(15);

    const { data: deals } = await supabase
      .from("deals")
      .select("title, value, stage, expected_close_date")
      .eq("user_id", lead.user_id)
      .limit(20);

    const prompt = `You are a senior sales strategist AI for a CRM. Analyze this lead and provide actionable insights.

Lead data:
${JSON.stringify({
  name: lead.name, email: lead.email, phone: lead.phone,
  company: lead.company, status: lead.status, source: lead.source,
  notes: lead.notes, lead_score: lead.lead_score,
  created_at: lead.created_at, updated_at: lead.updated_at,
  activities: activities?.map(a => ({ action: a.action, details: a.details, date: a.created_at })) || [],
  deals: deals?.map(d => ({ title: d.title, value: d.value, stage: d.stage, close: d.expected_close_date })) || [],
})}

Return ONLY valid JSON with this exact structure:
{
  "conversion_likelihood": "<High|Medium|Low> — one sentence explaining why",
  "recommended_action": "One specific, actionable next step to take right now",
  "follow_up_strategy": "2-3 sentence strategy for nurturing this lead to conversion",
  "strengths": ["strength 1", "strength 2"],
  "risks": ["risk 1", "risk 2"],
  "talking_points": ["point 1", "point 2", "point 3"]
}`;

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

    const insights = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lead-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
