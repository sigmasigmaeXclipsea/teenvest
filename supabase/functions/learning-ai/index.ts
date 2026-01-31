import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit, RateLimitConfig, validateCSRFToken, sanitizeInput, cspHeaders } from "../_shared/security.ts";

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

    // Note: CSRF protection removed as this function is already secured via JWT authentication
    // and only performs read-only AI recommendations (no state changes)

    console.log("Authenticated user:", claims.claims.sub);

    const body = await req.json();
    const { quizResults, completedModules, allModules } = body;

    // Sanitize inputs to prevent XSS
    const sanitizedQuizResults = (quizResults || []).map((r: any) => ({
      ...r,
      module_title: sanitizeInput(r.module_title),
    }));
    const sanitizedCompletedModules = (completedModules || []).map((m: any) => ({
      ...m,
      title: sanitizeInput(m.title),
      description: sanitizeInput(m.description),
    }));
    const sanitizedAllModules = (allModules || []).map((m: any) => ({
      ...m,
      title: sanitizeInput(m.title),
      description: sanitizeInput(m.description),
    }));
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    const systemPrompt = `You are a supportive learning coach for teens. Analyze quiz performance and create a personalized learning plan. Be encouraging and use simple language. Keep responses under 200 words.

Format:
1. **Progress**: Brief overview
2. **Strengths**: 2-3 topics mastered
3. **Focus Areas**: 2-3 topics needing work
4. **Learning Plan**: 3-4 specific exercises
5. **Pro Tip**: One actionable tip

Make learning feel achievable! 🎯`;

    const userMessage = `Please analyze my learning progress and create a personalized plan:

**Completed Modules**: ${sanitizedCompletedModules?.length || 0} out of ${sanitizedAllModules?.length || 0}

**Quiz Results**:
${sanitizedQuizResults && sanitizedQuizResults.length > 0 
  ? sanitizedQuizResults.map((r: any) => `- Module: ${r.module_title || 'Unknown'} | Score: ${r.score}/${r.total_questions} (${Math.round(r.score/r.total_questions*100)}%)`).join('\n')
  : 'No quizzes taken yet'}

**Available Modules**:
${sanitizedAllModules?.map((m: any) => `- ${m.title}: ${m.description}`).join('\n') || 'No modules available'}

Please give me personalized learning recommendations based on my performance!`;

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
      throw new Error("AI service temporarily unavailable");
    }

    const data = await response.json();
    const rawRecommendations = data.choices?.[0]?.message?.content || "Unable to generate recommendations at this time.";
    // Sanitize AI output to prevent XSS
    const recommendations = sanitizeInput(rawRecommendations);

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Learning AI error:", error);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});