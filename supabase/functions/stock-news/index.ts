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
    const { symbol, companyName } = await req.json();

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: "Symbol is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a financial news summarizer for teen investors. Your job is to provide recent, relevant news about a stock.

IMPORTANT GUIDELINES:
- Provide 3-5 recent news items about the company
- Each news item should have: headline, brief summary (1-2 sentences), and approximate date (like "2 days ago", "last week")
- Focus on news that would affect stock price: earnings, products, leadership changes, market trends
- Use simple language teens can understand
- Be factual and neutral - don't give buy/sell advice
- If you don't have recent news, mention general industry trends

Return your response as valid JSON in this exact format:
{
  "news": [
    {
      "headline": "Example Headline",
      "summary": "Brief summary of the news.",
      "date": "2 days ago",
      "sentiment": "positive" | "negative" | "neutral"
    }
  ],
  "marketSentiment": "bullish" | "bearish" | "neutral",
  "keyInsight": "One sentence summary of overall market sentiment for this stock"
}`;

    const userMessage = `Please provide recent news and market sentiment for ${symbol} (${companyName || symbol}). Focus on the most impactful recent developments.`;

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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service temporarily unavailable");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse the JSON from the response
    let newsData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        newsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse news response:", parseError);
      newsData = {
        news: [],
        marketSentiment: "neutral",
        keyInsight: "Unable to fetch news at this time."
      };
    }

    return new Response(JSON.stringify(newsData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Stock news error:", error);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
