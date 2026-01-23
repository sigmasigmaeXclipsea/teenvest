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

    const { trades, holdings } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a supportive investment coach for teens learning about paper trading. Your job is to analyze their trading history and explain what happened in simple, educational terms.

IMPORTANT GUIDELINES:
- Be encouraging and educational - never judgmental
- Use simple language that teens understand
- Focus on cause and effect: "You did X, then Y happened because..."
- Connect decisions to market events when possible
- Keep each explanation under 50 words
- Use emojis sparingly to keep it friendly 📈
- NEVER give buy/sell recommendations
- Focus on teaching, not advising

For each trade, provide:
1. A brief context of what happened
2. What market conditions existed
3. What the outcome taught them

Format as JSON array with objects containing:
- trade_id: string
- context: string (what they did)
- market_insight: string (what was happening in the market)
- lesson_learned: string (educational takeaway)
- sentiment: "positive" | "neutral" | "learning_moment"`;

    const userMessage = `Analyze these trades and provide educational context for each:

TRADES (most recent first):
${trades?.map((t: any) => 
  `- ${t.id}: ${t.trade_type.toUpperCase()} ${t.shares} shares of ${t.symbol} at $${t.price} on ${new Date(t.created_at).toLocaleDateString()}`
).join('\n') || 'No trades yet'}

CURRENT HOLDINGS:
${holdings?.map((h: any) => 
  `- ${h.symbol}: ${h.shares} shares @ avg $${h.average_cost}`
).join('\n') || 'No holdings'}

Provide educational insights for each trade as a JSON array.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
    
    // Try to parse JSON from the response
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

    return new Response(JSON.stringify({ insights: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in portfolio-timeline-ai:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
