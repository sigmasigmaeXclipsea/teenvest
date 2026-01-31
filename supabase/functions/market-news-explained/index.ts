import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabaseClient.auth.getClaims(token);

    if (authError || !claims?.claims) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", claims.claims.sub);

    const { userHoldings } = await req.json();
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const userSectors = userHoldings?.map((h: any) => h.sector).filter(Boolean) || [];
    const userSymbols = userHoldings?.map((h: any) => h.symbol) || [];

    const systemPrompt = `You are an educational market analyst for teens. Create daily market briefing explaining news simply. Focus on 3-4 events, explain WHY things happen, use teen analogies. Keep each item under 60 words. Never give trading advice.

For each news item:
- headline: string
- category: "macro" | "earnings" | "sector" | "global" | "tech" | "crypto"
- summary: string (what happened)
- why_it_matters: string (teen explanation)
- affected_sectors: string[]
- impact_type: "positive" | "negative" | "mixed" | "neutral"
- learning_concept: string
- icon: string (emoji)

Return as JSON array.`;

    const userMessage = `Generate today's market briefing for ${today}.

${userSymbols.length > 0 ? `The user holds: ${userSymbols.join(', ')}` : ''}
${userSectors.length > 0 ? `Their sectors: ${[...new Set(userSectors)].join(', ')}` : ''}

Create 3-4 educational news items about current market events. Focus on:
1. Major market moves or index changes
2. Any big company earnings or news
3. Sector-wide trends
4. Economic news that affects stocks

Make it educational and relevant to a teen learning to invest.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GOOGLE_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "[]";
    
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        content = JSON.parse(jsonMatch[0]);
      } else {
        content = [];
      }
    } catch {
      console.error("Failed to parse AI response as JSON");
      content = [];
    }

    return new Response(JSON.stringify({ 
      news: content,
      generated_at: new Date().toISOString(),
      date: today
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in market-news-explained:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});