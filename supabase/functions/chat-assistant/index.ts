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

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabaseUser = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) throw new Error("messages array is required");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all relevant CRM data for context
    const [leadsRes, dealsRes, contactsRes, activitiesRes] = await Promise.all([
      supabase.from("leads").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
      supabase.from("deals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
      supabase.from("contacts").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
      supabase.from("activities").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    ]);

    const leads = leadsRes.data || [];
    const deals = dealsRes.data || [];
    const contacts = contactsRes.data || [];
    const activities = activitiesRes.data || [];

    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const systemPrompt = `You are an intelligent CRM assistant. You have access to the user's CRM data and can answer questions about their leads, deals, contacts, and activities.

Today's date: ${today}
One week ago: ${weekAgo}

## CRM DATA

### Leads (${leads.length} total)
${JSON.stringify(leads.map(l => ({
  id: l.id, name: l.name, email: l.email, company: l.company,
  status: l.status, source: l.source, score: l.lead_score,
  notes: l.notes, created: l.created_at, updated: l.updated_at,
})), null, 2)}

### Deals (${deals.length} total)
${JSON.stringify(deals.map(d => ({
  id: d.id, title: d.title, stage: d.stage, value: d.value,
  close_date: d.expected_close_date, notes: d.notes,
  created: d.created_at, updated: d.updated_at,
})), null, 2)}

### Contacts (${contacts.length} total)
${JSON.stringify(contacts.map(c => ({
  id: c.id, name: c.name, email: c.email, phone: c.phone,
  company: c.company, job_title: c.job_title,
  created: c.created_at,
})), null, 2)}

### Recent Activities (${activities.length} entries)
${JSON.stringify(activities.map(a => ({
  action: a.action, type: a.entity_type, name: a.entity_name,
  details: a.details, date: a.created_at,
})), null, 2)}

## INSTRUCTIONS

1. Answer questions using the CRM data above
2. Be specific - reference actual names, values, and dates
3. Use markdown formatting for clarity (headers, lists, bold text)
4. If asked about "this week", use dates from ${weekAgo} to ${today}
5. For task suggestions, prioritize by deal value and lead score
6. Keep responses concise but comprehensive
7. If data doesn't exist, say so clearly and suggest what they could add
8. When listing items, use bullet points or numbered lists
9. For monetary values, format as $X,XXX`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
