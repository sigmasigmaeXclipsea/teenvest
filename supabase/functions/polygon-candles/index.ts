import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=60', // Browser cache for 1 minute
};

// Server-side cache
const serverCache = new Map<string, { data: any; timestamp: number }>();
const SERVER_CACHE_TTL = 30000; // 30 second server cache

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticker, timeframe } = await req.json();
    
    if (!ticker || typeof ticker !== 'string') {
      throw new Error('Invalid ticker symbol');
    }

    const apiKey = Deno.env.get('POLYGON_API_KEY');
    if (!apiKey) {
      throw new Error('Polygon API key not configured');
    }

    // Check server cache first
    const cacheKey = `${ticker.toUpperCase()}-${timeframe}`;
    const cached = serverCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SERVER_CACHE_TTL) {
      console.log(`Cache hit for ${cacheKey}`);
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const to = now.toISOString().split('T')[0];
    
    let from: string;
    let multiplier: number;
    let resolution: string;
    let limit = 60; // Target ~60 bars like TradingView
    
    switch (timeframe) {
      case '1D':
        // Intraday: 5-min bars for exactly 1 trading day
        // Fetch 1 day back, will get today's intraday data
        from = to; // Same day for intraday
        multiplier = 5;
        resolution = 'minute';
        limit = 78; // 6.5 hours of trading = 78 five-minute bars
        break;
      case '5D':
        // 5 days: 15-min bars for exactly 5 calendar days
        const fiveDaysAgo = new Date(now);
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        from = fiveDaysAgo.toISOString().split('T')[0];
        multiplier = 15;
        resolution = 'minute';
        limit = 130; // ~5 trading days * 26 bars per day
        break;
      case '1M':
        // Exactly 1 calendar month: daily bars
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        from = oneMonthAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        limit = 23; // ~22 trading days in a month
        break;
      case 'YTD':
        // Year to date: daily bars from Jan 1
        from = `${now.getFullYear()}-01-01`;
        multiplier = 1;
        resolution = 'day';
        limit = 252; // Max trading days in a year
        break;
      case '1Y':
        // Exactly 1 year: daily bars
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        from = oneYearAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        limit = 252; // ~252 trading days in a year
        break;
      default:
        // Default to 1 month
        const defaultAgo = new Date(now);
        defaultAgo.setMonth(defaultAgo.getMonth() - 1);
        from = defaultAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        limit = 23;
    }

    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker.toUpperCase()}/range/${multiplier}/${resolution}/${from}/${to}?adjusted=true&sort=asc&limit=1000&apiKey=${apiKey}`;
    
    console.log(`Fetching ${ticker} ${timeframe}: ${from} to ${to}`);

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Polygon error: ${response.status} - ${errorText}`);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'ERROR') {
      throw new Error(data.error || 'Polygon API error');
    }

    // Transform and sort data chronologically
    const allCandles = (data.results || [])
      .map((bar: any) => ({
        time: Math.floor(bar.t / 1000),
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v,
      }))
      .sort((a: any, b: any) => a.time - b.time);

    // Take the exact number of bars needed (already sorted asc)
    const candles = allCandles.slice(-limit);

    console.log(`Returning ${candles.length} candles for ${ticker}`);

    const result = { 
      candles,
      ticker: ticker.toUpperCase(),
      timeframe,
      totalBars: candles.length
    };

    // Cache the result
    serverCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
    console.error('Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage, candles: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
