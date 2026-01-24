import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Calculate date range based on timeframe
    const now = new Date();
    const to = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    let from: string;
    let multiplier = 1;
    let resolution = 'day';
    
    switch (timeframe) {
      case '1D':
        // For 1 day, get 5-minute bars for the last trading day
        const oneDayAgo = new Date(now);
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        from = oneDayAgo.toISOString().split('T')[0];
        multiplier = 5;
        resolution = 'minute';
        break;
      case '5D':
        // For 5 days, get 15-minute bars
        const fiveDaysAgo = new Date(now);
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        from = fiveDaysAgo.toISOString().split('T')[0];
        multiplier = 15;
        resolution = 'minute';
        break;
      case '1M':
        // For 1 month, get daily bars
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        from = oneMonthAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        break;
      case 'YTD':
        // Year to date, get daily bars
        from = `${now.getFullYear()}-01-01`;
        multiplier = 1;
        resolution = 'day';
        break;
      case '1Y':
        // For 1 year, get daily bars
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        from = oneYearAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        break;
      default:
        // Default to 1 month
        const defaultAgo = new Date(now);
        defaultAgo.setMonth(defaultAgo.getMonth() - 1);
        from = defaultAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
    }

    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker.toUpperCase()}/range/${multiplier}/${resolution}/${from}/${to}?adjusted=true&sort=asc&apiKey=${apiKey}`;
    
    console.log(`Fetching candles for ${ticker} from ${from} to ${to} with ${multiplier} ${resolution} resolution`);

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Polygon API error: ${response.status} - ${errorText}`);
      throw new Error(`Polygon API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'ERROR') {
      throw new Error(data.error || 'Polygon API returned an error');
    }

    // Transform to lightweight-charts format
    // Polygon returns: t (timestamp ms), o (open), h (high), l (low), c (close), v (volume)
    const candles = (data.results || []).map((bar: any) => ({
      time: Math.floor(bar.t / 1000), // Convert ms to seconds
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }));

    // Keep consistent bar count (around 60 bars like TradingView)
    const targetBars = 60;
    let finalCandles = candles;
    
    if (candles.length > targetBars) {
      // Sample to get ~60 bars
      const step = Math.floor(candles.length / targetBars);
      finalCandles = candles.filter((_: any, i: number) => i % step === 0).slice(-targetBars);
    }

    console.log(`Returning ${finalCandles.length} candles for ${ticker}`);

    return new Response(JSON.stringify({ 
      candles: finalCandles,
      ticker: ticker.toUpperCase(),
      timeframe,
      from,
      to,
      totalBars: data.resultsCount || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch candle data';
    console.error('Error in polygon-candles function:', errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      candles: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
