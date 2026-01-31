import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit, RateLimitConfig, sanitizeInput, cspHeaders } from "../_shared/security.ts";
import { estimateTokens, logCostUsage } from "../_shared/cost-monitor.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-csrf-token",
  "Access-Control-Allow-Credentials": "true",
  ...cspHeaders,
};

const rateLimitConfig: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 10 };

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
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    const systemPrompt = `You are TeenVest AI, a friendly financial assistant for teenagers. Be concise, helpful, and use simple language with occasional emojis.

Keep answers under 150 words. Focus on practical learning. Never give specific investment advice.

${context ? `CONTEXT: ${context}` : ''}`;

    // Estimate input tokens for cost tracking
    const inputText = systemPrompt + messages.map((m: any) => m.content).join('');
    const inputTokens = estimateTokens(inputText);
    
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
          ...messages,
        ],
        stream: true,
        max_tokens: 800,
        temperature: 0.7,
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

    // Create a transform stream to track output tokens
    const { readable, writable } = new TransformStream();
    let outputText = '';
    
    const responseReader = response.body?.getReader();
    const responseWriter = writable.getWriter();
    
    if (responseReader) {
      (async () => {
        try {
          while (true) {
            const { done, value } = await responseReader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            outputText += chunk;
            await responseWriter.write(value);
          }
        } finally {
          await responseWriter.close();
          
          // Log cost usage
          const outputTokens = estimateTokens(outputText);
          logCostUsage("gemini-2.5-flash-lite", inputTokens, outputTokens);
        }
      })();
    }

    return new Response(readable, {
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