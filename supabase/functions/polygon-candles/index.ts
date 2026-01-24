import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=60',
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
    let targetBars: number = 150; // Target ~150 bars per view like TradingView
    
    // TradingView-style: Each timeframe shows ~150 bars with appropriate resolution
    switch (timeframe) {
      case '1D':
        // 1 Day: 5-minute bars (~78 bars for a full trading day)
        const oneDayBack = new Date(now);
        oneDayBack.setDate(oneDayBack.getDate() - 2);
        from = oneDayBack.toISOString().split('T')[0];
        multiplier = 5;
        resolution = 'minute';
        targetBars = 100; // ~6.5 hours of trading
        break;
        
      case '5D':
        // 5 Days: 15-minute bars (~130 bars for 5 trading days)
        const fiveDaysBack = new Date(now);
        fiveDaysBack.setDate(fiveDaysBack.getDate() - 7);
        from = fiveDaysBack.toISOString().split('T')[0];
        multiplier = 15;
        resolution = 'minute';
        targetBars = 150;
        break;
        
      case '1M':
        // 1 Month: 1-hour bars (~150 bars, ~22 trading days * 6.5 hours)
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        from = oneMonthAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'hour';
        targetBars = 200;
        break;
        
      case 'YTD':
        // Year to date: Daily bars
        from = `${now.getFullYear()}-01-01`;
        multiplier = 1;
        resolution = 'day';
        targetBars = 300;
        break;
        
      case '1Y':
        // 1 Year: Daily bars (~252 trading days, show ~150 with ability to scroll)
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        from = oneYearAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        targetBars = 300;
        break;
        
      case '2Y':
        // 2 Years: Weekly bars (~104 weeks, show ~100-150 bars)
        const twoYearsAgo = new Date(now);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        from = twoYearsAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'week';
        targetBars = 150;
        break;
        
      default:
        // Default to 1 month
        const defaultAgo = new Date(now);
        defaultAgo.setMonth(defaultAgo.getMonth() - 1);
        from = defaultAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'hour';
        targetBars = 150;
    }

    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker.toUpperCase()}/range/${multiplier}/${resolution}/${from}/${to}?adjusted=true&sort=asc&limit=${targetBars + 50}&apiKey=${apiKey}`;
    
    console.log(`Fetching ${ticker} ${timeframe}: ${multiplier} ${resolution} from ${from} to ${to}`);

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

    // For intraday, filter to just the most recent trading sessions
    let candles = allCandles;
    if (timeframe === '1D') {
      // Get only the last trading day's worth of data
      candles = allCandles.slice(-78);
    } else if (timeframe === '5D') {
      // Get the last 5 trading days worth
      candles = allCandles.slice(-130);
    }

    console.log(`Returning ${candles.length} candles for ${ticker} (${timeframe})`);

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
