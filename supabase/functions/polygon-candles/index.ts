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
    let limit: number;
    
    // With Starter/Advanced plan, we can use intraday minute data
    switch (timeframe) {
      case '1D':
        // 1 Day: 5-minute bars for the current trading day
        // Fetch last 2 days to ensure we get today's data
        const oneDayBack = new Date(now);
        oneDayBack.setDate(oneDayBack.getDate() - 2);
        from = oneDayBack.toISOString().split('T')[0];
        multiplier = 5;
        resolution = 'minute';
        limit = 78; // 6.5 hours trading = 78 five-minute bars
        break;
        
      case '5D':
        // 5 Days: 15-minute bars
        const fiveDaysBack = new Date(now);
        fiveDaysBack.setDate(fiveDaysBack.getDate() - 7); // Extra days for weekends
        from = fiveDaysBack.toISOString().split('T')[0];
        multiplier = 15;
        resolution = 'minute';
        limit = 130; // ~5 trading days * 26 bars per day
        break;
        
      case '1M':
        // 1 Month: Daily bars for exactly 1 calendar month
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        from = oneMonthAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        limit = 30; // ~22 trading days, get extra to ensure coverage
        break;
        
      case 'YTD':
        // Year to date: Daily bars from January 1st of current year
        from = `${now.getFullYear()}-01-01`;
        multiplier = 1;
        resolution = 'day';
        limit = 366; // Max possible days in a year
        break;
        
      case '1Y':
        // 1 Year: Daily bars for exactly 1 calendar year
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        from = oneYearAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        limit = 366; // Account for leap year
        break;
        
      case '2Y':
        // 2 Years: Daily bars for 2 calendar years (~500 trading days)
        const twoYearsAgo = new Date(now);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        from = twoYearsAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        limit = 600; // ~500 trading days in 2 years + buffer
        break;
        
      default:
        // Default to 1 month of daily bars
        const defaultAgo = new Date(now);
        defaultAgo.setMonth(defaultAgo.getMonth() - 1);
        from = defaultAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        limit = 30;
    }

    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker.toUpperCase()}/range/${multiplier}/${resolution}/${from}/${to}?adjusted=true&sort=asc&limit=${limit}&apiKey=${apiKey}`;
    
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
