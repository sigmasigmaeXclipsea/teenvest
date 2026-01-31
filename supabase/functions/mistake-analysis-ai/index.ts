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

    const { trades, holdings, portfolio, startingBalance } = await req.json();
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    const systemPrompt = `You are a teen investment coach. Identify common trading mistakes in a supportive way. Look for: overconcentration, panic selling, chasing performance, lack of diversification, overtrading, holding losers, FOMO buying.

Be encouraging, use teen-friendly language, keep explanations under 50 words each. Max 4 insights.

Format as JSON array with:
- id: string
- pattern: string
- severity: "low" | "medium" | "high"
- title: string
- explanation: string
- action: string
- related_lesson: string
- icon: string (emoji)`;

    const portfolioValue = holdings?.reduce((sum: number, h: any) => 
      sum + (h.shares * h.average_cost), 0) + (portfolio?.cash_balance || 0);
    
    const gainPercent = ((portfolioValue - startingBalance) / startingBalance * 100).toFixed(2);

    const userMessage = `Analyze this teen's trading behavior for common mistakes:

PORTFOLIO SUMMARY:
- Starting balance: $${startingBalance}
- Current value: $${portfolioValue?.toFixed(2)}
- Performance: ${gainPercent}%
- Cash on hand: $${portfolio?.cash_balance?.toFixed(2)}

CURRENT HOLDINGS (${holdings?.length || 0} positions):
${holdings?.map((h: any) => 
  `- ${h.symbol} (${h.sector || 'Unknown sector'}): ${h.shares} shares @ $${h.average_cost}`
).join('\n') || 'No holdings'}

RECENT TRADES (${trades?.length || 0} total):
${trades?.slice(0, 20).map((t: any) => {
  const date = new Date(t.created_at);
  return `- ${date.toLocaleDateString()}: ${t.trade_type.toUpperCase()} ${t.shares} ${t.symbol} @ $${t.price}`;
}).join('\n') || 'No trades'}

Identify any concerning patterns and provide supportive feedback as a JSON array.`;

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

    return new Response(JSON.stringify({ patterns: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in mistake-analysis-ai:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});