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
        // 5-min bars for last 2 days
        const twoDaysAgo = new Date(now);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        from = twoDaysAgo.toISOString().split('T')[0];
        multiplier = 5;
        resolution = 'minute';
        break;
      case '5D':
        // 30-min bars for ~7 days
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        from = weekAgo.toISOString().split('T')[0];
        multiplier = 30;
        resolution = 'minute';
        break;
      case '1M':
        // Daily bars for 3 months
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        from = threeMonthsAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        break;
      case 'YTD':
        from = `${now.getFullYear()}-01-01`;
        multiplier = 1;
        resolution = 'day';
        break;
      case '1Y':
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        from = oneYearAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        break;
      default:
        const defaultAgo = new Date(now);
        defaultAgo.setMonth(defaultAgo.getMonth() - 3);
        from = defaultAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
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

    // Transform data
    const allCandles = (data.results || []).map((bar: any) => ({
      time: Math.floor(bar.t / 1000),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }));

    // Take last ~60 bars for consistent display
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
