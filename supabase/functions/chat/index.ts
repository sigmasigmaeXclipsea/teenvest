import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit, RateLimitConfig, sanitizeInput, cspHeaders } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-csrf-token",
  "Access-Control-Allow-Credentials": "true",
  ...cspHeaders,
};

const rateLimitConfig: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 20 };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
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
      console.error("Auth validation failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting per user
    const rateLimitResult = rateLimit(claims.claims.sub as string, rateLimitConfig);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString(),
          } 
        }
      );
    }

    // CSRF protection for state-changing requests
    if (req.method !== "GET" && req.method !== "HEAD") {
      const csrfToken = req.headers.get("X-CSRF-Token");
      if (!csrfToken || csrfToken.length < 16) {
        return new Response(
          JSON.stringify({ error: "CSRF token required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("Authenticated user:", claims.claims.sub);

    const body = await req.json();
    const { messages, context } = body;

    // Sanitize inputs
    const sanitizedMessages = (messages || []).map((m: any) => ({
      ...m,
      content: sanitizeInput(m.content),
    }));
    const sanitizedContext = sanitizeInput(context);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are TeenVest AI, a friendly and knowledgeable financial assistant designed specifically for teenagers learning about investing. You're like a smart older sibling who happens to know a lot about money!

YOUR PERSONALITY:
- Friendly, patient, and encouraging
- Use simple language - explain complex terms like you're talking to a friend
- Add relevant emojis occasionally to keep it engaging 💰📈
- Be honest about risks without being scary
- Celebrate their learning and curiosity!

WHAT YOU CAN HELP WITH:
1. **Stock Questions**: Explain what stocks are, how they work, different types
2. **Portfolio Advice**: Help understand diversification, risk management, asset allocation
3. **Financial Terms**: Define and explain any investing/finance terms simply
4. **Learning Support**: Guide them through lessons and exercises on the platform
5. **Market Concepts**: Explain how markets work, why prices change, etc.
6. **Career & Money**: Basic personal finance, saving, budgeting for teens

GUIDELINES:
- Keep responses concise (under 200 words unless they ask for detail)
- Use examples teens can relate to (gaming, social media companies, etc.)
- When explaining concepts, use analogies (e.g., "Diversification is like not putting all your eggs in one basket")
- If they ask about specific trades, remind them this is paper trading for learning
- Never give specific buy/sell recommendations for real money
- Encourage them to keep learning!

${context ? `CURRENT CONTEXT:\n${context}` : ''}

Remember: You're helping build financial literacy in the next generation. Make it fun and empowering!`;

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
          ...messages,
        ],
        stream: true,
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
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat AI error:", error);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
