import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  rateLimit, 
  RateLimitConfig, 
  sanitizeInput, 
  secureCorsHeaders,
  createRateLimitResponse,
  createErrorResponse,
  createSuccessResponse
} from "../_shared/security.ts";

const rateLimitConfig: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 15 };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: secureCorsHeaders });
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Validate request size (max 10KB)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10240) {
      return createErrorResponse('Request too large', 413);
    }

    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse("Authentication required", 401);
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
      return createErrorResponse("Authentication required", 401);
    }

    // Rate limiting per user
    const userId = claims.claims.sub as string;
    const rateLimitResult = rateLimit(userId, rateLimitConfig);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user: ${userId}`);
      return createRateLimitResponse(rateLimitResult.resetTime!);
    }

    console.log("Authenticated user:", userId);

    const { trades, holdings, portfolio, startingBalance } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return createErrorResponse("Service temporarily unavailable", 503);
    }

    // Sanitize and validate inputs
    const sanitizedTrades = (trades || []).slice(0, 50).map((t: any) => ({
      ...t,
      symbol: sanitizeInput(t.symbol),
      company_name: sanitizeInput(t.company_name),
    }));

    const sanitizedHoldings = (holdings || []).slice(0, 50).map((h: any) => ({
      ...h,
      symbol: sanitizeInput(h.symbol),
      sector: sanitizeInput(h.sector),
    }));

    const systemPrompt = `You are a supportive investment coach for teens. Analyze their trading patterns to identify common mistakes and learning opportunities.

PATTERNS TO LOOK FOR:
1. Overconcentration - Too much in one stock/sector
2. Panic selling - Selling quickly after buying
3. Chasing performance - Buying after big gains
4. Lack of diversification - Too few positions
5. Overtrading - Too many trades in short time
6. Holding losers too long - Not cutting losses
7. FOMO buying - Buying at peaks
8. Ignoring sectors - No sector balance

GUIDELINES:
- Be encouraging, never judgmental
- Use teen-friendly language
- Each insight should be actionable
- Link to learning concepts they can study
- Keep explanations under 60 words each
- Use emojis to keep it friendly
- Max 5 insights per analysis

Format as JSON array with objects containing:
- id: string (unique identifier)
- pattern: string (name of pattern)
- severity: "low" | "medium" | "high"
- title: string (teen-friendly headline)
- explanation: string (why this matters)
- action: string (what they can do)
- related_lesson: string (topic to learn about)
- icon: string (emoji representing the pattern)`;

    const portfolioValue = sanitizedHoldings?.reduce((sum: number, h: any) => 
      sum + (h.shares * h.average_cost), 0) + (portfolio?.cash_balance || 0);
    
    const gainPercent = ((portfolioValue - startingBalance) / startingBalance * 100).toFixed(2);

    const userMessage = `Analyze this teen's trading behavior for common mistakes:

PORTFOLIO SUMMARY:
- Starting balance: $${startingBalance}
- Current value: $${portfolioValue?.toFixed(2)}
- Performance: ${gainPercent}%
- Cash on hand: $${portfolio?.cash_balance?.toFixed(2)}

CURRENT HOLDINGS (${sanitizedHoldings?.length || 0} positions):
${sanitizedHoldings?.map((h: any) => 
  `- ${h.symbol} (${h.sector || 'Unknown sector'}): ${h.shares} shares @ $${h.average_cost}`
).join('\n') || 'No holdings'}

RECENT TRADES (${sanitizedTrades?.length || 0} total):
${sanitizedTrades?.slice(0, 20).map((t: any) => {
  const date = new Date(t.created_at);
  return `- ${date.toLocaleDateString()}: ${t.trade_type.toUpperCase()} ${t.shares} ${t.symbol} @ $${t.price}`;
}).join('\n') || 'No trades'}

Identify any concerning patterns and provide supportive feedback as a JSON array.`;

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
        return createErrorResponse("AI service rate limit. Please try again later.", 429);
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return createErrorResponse("AI service temporarily unavailable", 502);
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

    return createSuccessResponse({ patterns: content });

  } catch (error) {
    console.error("Error in mistake-analysis-ai:", error);
    return createErrorResponse("An error occurred", 500);
  }
});
