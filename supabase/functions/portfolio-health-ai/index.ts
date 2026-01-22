import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { holdings, cashBalance, totalValue, startingBalance } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const gainLoss = totalValue - startingBalance;
    const gainLossPercent = ((totalValue - startingBalance) / startingBalance * 100).toFixed(2);

    const systemPrompt = `You are a friendly financial advisor for teens who are learning to invest. Your job is to analyze their portfolio and give clear, encouraging, teen-friendly advice.

IMPORTANT GUIDELINES:
- Use simple language that a 14-17 year old can understand
- Explain financial terms when you use them (e.g., "diversification means spreading your money across different types of investments")
- Be encouraging but honest about risks
- Use emojis sparingly to keep it engaging 📈
- Give 3-5 specific, actionable suggestions
- Highlight what they're doing well first, then areas to improve
- Keep your total response under 400 words

Format your response like this:
1. **Portfolio Health Score**: Give a score out of 100 with a brief explanation
2. **What You're Doing Well**: 2-3 strengths
3. **Areas to Improve**: 2-3 weaknesses with simple explanations
4. **Action Steps**: 3-5 specific things they can do to improve

Remember: This is paper trading for learning, so focus on teaching good habits!`;

    const userMessage = `Please analyze my portfolio:

**Cash Balance**: $${cashBalance?.toFixed(2) || 0}
**Total Portfolio Value**: $${totalValue?.toFixed(2) || 0}
**Starting Balance**: $${startingBalance?.toFixed(2) || 0}
**Overall Gain/Loss**: ${gainLoss >= 0 ? '+' : ''}$${gainLoss.toFixed(2)} (${gainLossPercent}%)

**My Holdings**:
${holdings && holdings.length > 0 
  ? holdings.map((h: any) => `- ${h.symbol} (${h.company_name}): ${h.shares} shares at avg cost $${h.average_cost?.toFixed(2)} | Sector: ${h.sector || 'Unknown'}`).join('\n')
  : 'No holdings yet - all cash'}

Please give me a teen-friendly analysis of my portfolio health and how I can improve!`;

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Unable to analyze portfolio at this time.";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Portfolio health AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
