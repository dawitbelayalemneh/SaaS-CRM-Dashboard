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
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { leadId } = await req.json();
    if (!leadId) throw new Error("leadId is required");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch lead data
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();
    if (leadError || !lead) throw new Error("Lead not found");

    // Fetch related deals for context
    const { data: deals } = await supabase
      .from("deals")
      .select("title, value, stage")
      .eq("user_id", lead.user_id)
      .limit(20);

    // Fetch activity history
    const { data: activities } = await supabase
      .from("activities")
      .select("action, entity_type, details, created_at")
      .eq("entity_id", leadId)
      .order("created_at", { ascending: false })
      .limit(10);

    const prompt = `You are a lead scoring AI for a CRM system. Analyze this lead and return ONLY a JSON object with "score" (integer 1-100) and "reasoning" (one sentence).

Scoring criteria:
- Company presence (has company name = higher)
- Contact completeness (email + phone = higher)  
- Lead source quality (referral > website > cold)
- Status progression (qualified > contacted > new, lost = low)
- Interaction history (more activities = higher engagement)
- Related deals (existing deals = higher potential)
- Notes quality (detailed notes = better qualification)

Lead data:
${JSON.stringify({
  name: lead.name,
  email: lead.email,
  phone: lead.phone,
  company: lead.company,
  status: lead.status,
  source: lead.source,
  notes: lead.notes,
  created_at: lead.created_at,
  activities_count: activities?.length || 0,
  recent_activities: activities?.slice(0, 5).map(a => a.action) || [],
  related_deals: deals?.map(d => ({ title: d.title, value: d.value, stage: d.stage })) || [],
})}

Return ONLY valid JSON: {"score": <number>, "reasoning": "<string>"}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*?"score"[\s\S]*?"reasoning"[\s\S]*?\}/);
    if (!jsonMatch) throw new Error("Could not parse AI response");
    
    const parsed = JSON.parse(jsonMatch[0]);
    const score = Math.max(1, Math.min(100, Math.round(parsed.score)));

    // Save score to database
    const { error: updateError } = await supabase
      .from("leads")
      .update({ lead_score: score })
      .eq("id", leadId);
    if (updateError) throw new Error("Failed to save score");

    return new Response(JSON.stringify({ score, reasoning: parsed.reasoning }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-lead error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
