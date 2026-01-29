import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit, RateLimitConfig } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "public, max-age=300",
};

const rateLimitConfig: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 5 };

const serverCache = new Map<string, { data: any; timestamp: number }>();
const SERVER_CACHE_TTL = 5 * 60 * 1000;

const ALPHA_BASE_URL = "https://www.alphavantage.co/query";

type TimeframeOption = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "2Y" | "YTD";
const EMA_MIN_PERIOD = 5;
const EMA_MAX_PERIOD = 200;
const DEFAULT_EMA_PERIOD = 20;

const timeframeToAlpha = (timeframe: TimeframeOption) => {
  switch (timeframe) {
    case "1D":
      return { interval: "5min", outputsize: "compact" as const };
    case "5D":
      return { interval: "15min", outputsize: "compact" as const };
    case "1M":
      return { interval: "60min", outputsize: "full" as const };
    case "3M":
      return { interval: "60min", outputsize: "full" as const };
    case "6M":
    case "1Y":
    case "2Y":
    case "YTD":
      return { interval: "daily", outputsize: "full" as const };
    default:
      return { interval: "daily", outputsize: "full" as const };
  }
};

const parseAlphaTime = (raw: string): number | null => {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  const hasTime = trimmed.includes(" ");
  const [datePart, timePart] = hasTime ? trimmed.split(" ") : [trimmed, "00:00"];
  const normalizedTime = timePart.length === 5 ? `${timePart}:00` : timePart;
  const iso = `${datePart}T${normalizedTime}Z`;
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return null;
  return Math.floor(parsed / 1000);
};

const parseSeries = (raw: Record<string, any>, mapper: (entry: any) => any) => {
  const entries = Object.entries(raw || {});
  const parsed = entries
    .map(([time, value]) => {
      const ts = parseAlphaTime(time);
      if (!ts) return null;
      return mapper({ time: ts, value });
    })
    .filter((v) => v !== null) as any[];
  parsed.sort((a, b) => a.time - b.time);
  return parsed;
};

const alphaFetch = async (params: Record<string, string>) => {
  const url = new URL(ALPHA_BASE_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Alpha Vantage error: ${res.status} ${errorText}`);
  }
  const json = await res.json();
  if (json?.Note || json?.Information) {
    const message = json?.Note || json?.Information;
    const error = new Error(message);
    (error as any).status = 429;
    throw error;
  }
  if (json?.["Error Message"]) {
    throw new Error(json["Error Message"]);
  }
  return json;
};

const normalizeEmaPeriod = (raw: unknown) => {
  const parsed = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_EMA_PERIOD;
  const rounded = Math.round(parsed);
  if (rounded < EMA_MIN_PERIOD) return EMA_MIN_PERIOD;
  if (rounded > EMA_MAX_PERIOD) return EMA_MAX_PERIOD;
  return rounded;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    const body = await req.json();
    const rawTicker = typeof body?.ticker === "string" ? body.ticker.trim().toUpperCase() : "";
    const timeframe = (body?.timeframe || "1M") as TimeframeOption;
    const emaPeriod = normalizeEmaPeriod(body?.emaPeriod);
    if (!rawTicker || !/^[A-Z]{1,5}$/.test(rawTicker)) {
      return new Response(
        JSON.stringify({ error: "Invalid ticker symbol" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ALPHAVANTAGE_API_KEY");
    if (!apiKey) {
      throw new Error("ALPHAVANTAGE_API_KEY is not configured");
    }

    const cacheKey = `${rawTicker}-${timeframe}-ema${emaPeriod}`;
    const cached = serverCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SERVER_CACHE_TTL) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { interval, outputsize } = timeframeToAlpha(timeframe);

    const [rsiJson, emaJson, macdJson] = await Promise.all([
      alphaFetch({
        function: "RSI",
        symbol: rawTicker,
        interval,
        time_period: "14",
        series_type: "close",
        outputsize,
        apikey: apiKey,
      }),
      alphaFetch({
        function: "EMA",
        symbol: rawTicker,
        interval,
        time_period: emaPeriod.toString(),
        series_type: "close",
        outputsize,
        apikey: apiKey,
      }),
      alphaFetch({
        function: "MACD",
        symbol: rawTicker,
        interval,
        series_type: "close",
        fastperiod: "12",
        slowperiod: "26",
        signalperiod: "9",
        outputsize,
        apikey: apiKey,
      }),
    ]);

    const rsiRaw = rsiJson?.["Technical Analysis: RSI"] ?? {};
    const emaRaw = emaJson?.["Technical Analysis: EMA"] ?? {};
    const macdRaw = macdJson?.["Technical Analysis: MACD"] ?? {};

    const rsi = parseSeries(rsiRaw, ({ time, value }) => ({
      time,
      value: Number(value?.RSI),
    })).filter((point) => Number.isFinite(point.value));

    const ema = parseSeries(emaRaw, ({ time, value }) => ({
      time,
      value: Number(value?.EMA),
    })).filter((point) => Number.isFinite(point.value));

    const macd = parseSeries(macdRaw, ({ time, value }) => ({
      time,
      value: Number(value?.MACD),
      signal: Number(value?.MACD_Signal),
      hist: Number(value?.MACD_Hist),
    })).filter((point) => [point.value, point.signal, point.hist].every(Number.isFinite));

    const result = {
      ticker: rawTicker,
      timeframe,
      interval,
      rsi: { period: 14, values: rsi },
      ema: { period: emaPeriod, values: ema },
      macd: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, values: macd },
    };

    serverCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const status = (error as any)?.status || 500;
    const message = (error as Error)?.message || "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
