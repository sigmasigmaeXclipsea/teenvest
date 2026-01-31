import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit, RateLimitConfig, sanitizeInput, cspHeaders } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-csrf-token",
  "Access-Control-Allow-Credentials": "true",
  ...cspHeaders,
};

const rateLimitConfig: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 8 };

type RpePayload = {
  symbol?: string;
  tradeType?: string;
  predictionDirection?: string;
  thesis?: string;
  indicators?: string[];
  horizonLabel?: string;
  actualChangePct?: number;
  rpe?: number;
  directionCorrect?: boolean;
};

const parseNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabaseClient.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
          },
        }
      );
    }

    const body = (await req.json()) as RpePayload;
    const symbol = sanitizeInput(body.symbol ?? "");
    const tradeType = sanitizeInput(body.tradeType ?? "");
    const predictionDirection = sanitizeInput(body.predictionDirection ?? "");
    const thesis = sanitizeInput(body.thesis ?? "");
    const horizonLabel = sanitizeInput(body.horizonLabel ?? "");
    const indicators = Array.isArray(body.indicators)
      ? body.indicators.map((item) => sanitizeInput(item)).filter(Boolean)
      : [];
    const actualChangePct = parseNumber(body.actualChangePct);
    const rpe = parseNumber(body.rpe);
    const directionCorrect = typeof body.directionCorrect === "boolean" ? body.directionCorrect : null;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a performance coach for teen investors. You review a user's trade prediction and the RPE (reward prediction error) outcome.

GOALS:
- Give clear, motivating feedback in plain language.
- Highlight whether the reasoning aligned with the outcome.
- Offer 2-3 actionable improvements for future predictions.
- Keep it under 180 words. No markdown.`;

    const userMessage = `Trade context:
- Symbol: ${symbol || "N/A"}
- Trade type: ${tradeType || "N/A"}
- Prediction direction: ${predictionDirection || "N/A"}
- Horizon: ${horizonLabel || "N/A"}
- Indicators: ${indicators.length > 0 ? indicators.join(", ") : "None"}
- Thesis: ${thesis || "N/A"}

Outcome:
- Actual change: ${actualChangePct !== null ? (actualChangePct * 100).toFixed(2) + "%" : "N/A"}
- RPE: ${rpe !== null ? (rpe * 100).toFixed(2) + "%" : "N/A"}
- Direction correct: ${directionCorrect === null ? "N/A" : directionCorrect ? "Yes" : "No"}

Provide coaching feedback that uses the RPE info.`;

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
      throw new Error("AI service temporarily unavailable");
    }

    const data = await response.json();
    const rawFeedback = data.choices?.[0]?.message?.content || "Unable to generate feedback at this time.";
    const feedback = sanitizeInput(rawFeedback);

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("RPE feedback error:", error);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
