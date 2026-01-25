import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=60',
};

// Server-side cache
const serverCache = new Map<string, { data: any; timestamp: number }>();
const SERVER_CACHE_TTL = 60000; // 60 second server cache

interface PolygonBar {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface PolygonResponse {
  status: string;
  results?: PolygonBar[];
  next_url?: string;
  error?: string;
}

// Recursive function to fetch all paginated data
async function fetchAllData(initialUrl: string, apiKey: string): Promise<PolygonBar[]> {
  const allResults: PolygonBar[] = [];
  let nextUrl: string | null = initialUrl;
  let pageCount = 0;
  const maxPages = 10; // Safety limit to prevent infinite loops

  while (nextUrl && pageCount < maxPages) {
    console.log(`Fetching page ${pageCount + 1}: ${nextUrl.substring(0, 100)}...`);
    
    const res: Response = await fetch(nextUrl);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Polygon error: ${res.status} - ${errorText}`);
      throw new Error(`API error: ${res.status}`);
    }

    const json: PolygonResponse = await res.json();
    
    if (json.status === 'ERROR') {
      throw new Error(json.error || 'Polygon API error');
    }

    if (json.results && json.results.length > 0) {
      allResults.push(...json.results);
    }

    // Check for next_url for pagination
    if (json.next_url) {
      // Polygon returns next_url without the API key, so we need to append it
      nextUrl = json.next_url.includes('apiKey') 
        ? json.next_url 
        : `${json.next_url}&apiKey=${apiKey}`;
    } else {
      nextUrl = null;
    }

    pageCount++;
  }

  console.log(`Fetched ${allResults.length} total bars across ${pageCount} pages`);
  return allResults;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - require valid user token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required', candles: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authError } = await supabaseClient.auth.getClaims(token);

    if (authError || !claims?.claims) {
      console.error('Auth error:', authError?.message || 'Invalid token');
      return new Response(
        JSON.stringify({ error: 'Authentication required', candles: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${claims.claims.sub}`);

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
    let displayResolution: string;
    
    // TradingView-style: Each timeframe gets appropriate resolution for ~150-200 visible bars
    // Full data is fetched, user can scroll through all of it
    switch (timeframe) {
      case '1D':
        // 1 Day: 5-minute bars for intraday view
        const oneDayBack = new Date(now);
        oneDayBack.setDate(oneDayBack.getDate() - 2); // Extra day to ensure we get full trading day
        from = oneDayBack.toISOString().split('T')[0];
        multiplier = 5;
        resolution = 'minute';
        displayResolution = '5m';
        break;
        
      case '5D':
        // 5 Days: 15-minute bars
        const fiveDaysBack = new Date(now);
        fiveDaysBack.setDate(fiveDaysBack.getDate() - 7);
        from = fiveDaysBack.toISOString().split('T')[0];
        multiplier = 15;
        resolution = 'minute';
        displayResolution = '15m';
        break;
        
      case '1M':
        // 1 Month: 1-hour bars
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        from = oneMonthAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'hour';
        displayResolution = '1H';
        break;
        
      case '3M':
        // 3 Months: 4-hour bars
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        from = threeMonthsAgo.toISOString().split('T')[0];
        multiplier = 4;
        resolution = 'hour';
        displayResolution = '4H';
        break;
        
      case '6M':
        // 6 Months: Daily bars
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        from = sixMonthsAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        displayResolution = '1D';
        break;
        
      case 'YTD':
        // Year to date: Daily bars
        from = `${now.getFullYear()}-01-01`;
        multiplier = 1;
        resolution = 'day';
        displayResolution = '1D';
        break;
        
      case '1Y':
        // 1 Year: Daily bars
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        from = oneYearAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        displayResolution = '1D';
        break;
        
      case '2Y':
        // 2 Years: Daily bars (will give ~500 trading days)
        const twoYearsAgo = new Date(now);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        from = twoYearsAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        displayResolution = '1D';
        break;
        
      default:
        // Default to 1 month
        const defaultAgo = new Date(now);
        defaultAgo.setMonth(defaultAgo.getMonth() - 1);
        from = defaultAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'hour';
        displayResolution = '1H';
    }

    // Build initial URL with high limit to minimize pagination
    const initialUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker.toUpperCase()}/range/${multiplier}/${resolution}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${apiKey}`;
    
    console.log(`Fetching ${ticker} ${timeframe}: ${multiplier} ${resolution} from ${from} to ${to}`);

    // Recursively fetch all paginated data
    const allResults = await fetchAllData(initialUrl, apiKey);

    // Transform and sort data chronologically
    const candles = allResults
      .map((bar: any) => ({
        time: Math.floor(bar.t / 1000),
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v,
      }))
      .sort((a: any, b: any) => a.time - b.time);

    // Deduplicate by time (in case of overlapping pages)
    const uniqueCandles = candles.filter((candle: any, index: number, arr: any[]) => 
      index === 0 || candle.time !== arr[index - 1].time
    );

    console.log(`Returning ${uniqueCandles.length} unique candles for ${ticker} (${timeframe})`);

    const result = { 
      candles: uniqueCandles,
      ticker: ticker.toUpperCase(),
      timeframe,
      resolution: displayResolution,
      totalBars: uniqueCandles.length
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