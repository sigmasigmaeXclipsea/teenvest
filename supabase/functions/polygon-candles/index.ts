import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  rateLimit, 
  rateLimitByIP,
  RateLimitConfig, 
  validateSymbol,
  secureCorsHeaders,
  createRateLimitResponse,
  createErrorResponse,
  createSuccessResponse
} from "../_shared/security.ts";

// Strict rate limits
const userRateLimitConfig: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 10 };
const ipRateLimitConfig: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 30 };

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

// Recursive function to fetch all paginated data with timeout
async function fetchAllData(initialUrl: string, apiKey: string): Promise<PolygonBar[]> {
  const allResults: PolygonBar[] = [];
  let nextUrl: string | null = initialUrl;
  let pageCount = 0;
  const maxPages = 5; // Reduced for security
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    while (nextUrl && pageCount < maxPages) {
      console.log(`Fetching page ${pageCount + 1}`);
      
      const res: Response = await fetch(nextUrl, { signal: controller.signal });
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const json: PolygonResponse = await res.json();
      
      if (json.status === 'ERROR') {
        throw new Error(json.error || 'Polygon API error');
      }

      if (json.results && json.results.length > 0) {
        allResults.push(...json.results);
      }

      if (json.next_url) {
        nextUrl = json.next_url.includes('apiKey') 
          ? json.next_url 
          : `${json.next_url}&apiKey=${apiKey}`;
      } else {
        nextUrl = null;
      }

      pageCount++;
    }
  } finally {
    clearTimeout(timeout);
  }

  console.log(`Fetched ${allResults.length} total bars across ${pageCount} pages`);
  return allResults;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: secureCorsHeaders });
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Validate request size (max 2KB)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 2048) {
      return createErrorResponse('Request too large', 413);
    }

    // IP-based rate limiting first
    const ipRateLimitResult = rateLimitByIP(req, ipRateLimitConfig);
    if (!ipRateLimitResult.allowed) {
      console.warn('IP rate limit exceeded');
      return createRateLimitResponse(ipRateLimitResult.resetTime!);
    }

    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return createErrorResponse('Authentication required', 401);
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
      return createErrorResponse('Authentication required', 401);
    }

    // User-based rate limiting
    const userId = claims.claims.sub as string;
    const userRateLimitResult = rateLimit(userId, userRateLimitConfig);
    if (!userRateLimitResult.allowed) {
      console.warn(`User rate limit exceeded: ${userId}`);
      return createRateLimitResponse(userRateLimitResult.resetTime!);
    }

    console.log(`Authenticated user: ${userId}`);

    const body = await req.json();
    const ticker = validateSymbol(body?.ticker);
    const timeframe = body?.timeframe;
    
    if (!ticker) {
      return createErrorResponse('Invalid ticker symbol', 400);
    }

    // Validate timeframe
    const validTimeframes = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '2Y'];
    if (timeframe && !validTimeframes.includes(timeframe)) {
      return createErrorResponse('Invalid timeframe', 400);
    }

    const apiKey = Deno.env.get('POLYGON_API_KEY');
    if (!apiKey) {
      console.error('Polygon API key not configured');
      return createErrorResponse('Service temporarily unavailable', 503);
    }

    // Check server cache first
    const cacheKey = `${ticker}-${timeframe}`;
    const cached = serverCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SERVER_CACHE_TTL) {
      console.log(`Cache hit for ${cacheKey}`);
      return createSuccessResponse(cached.data);
    }

    const now = new Date();
    const to = now.toISOString().split('T')[0];
    
    let from: string;
    let multiplier: number;
    let resolution: string;
    let displayResolution: string;
    
    switch (timeframe) {
      case '1D':
        const oneDayBack = new Date(now);
        oneDayBack.setDate(oneDayBack.getDate() - 2);
        from = oneDayBack.toISOString().split('T')[0];
        multiplier = 5;
        resolution = 'minute';
        displayResolution = '5m';
        break;
        
      case '5D':
        const fiveDaysBack = new Date(now);
        fiveDaysBack.setDate(fiveDaysBack.getDate() - 7);
        from = fiveDaysBack.toISOString().split('T')[0];
        multiplier = 15;
        resolution = 'minute';
        displayResolution = '15m';
        break;
        
      case '1M':
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        from = oneMonthAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'hour';
        displayResolution = '1H';
        break;
        
      case '3M':
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        from = threeMonthsAgo.toISOString().split('T')[0];
        multiplier = 4;
        resolution = 'hour';
        displayResolution = '4H';
        break;
        
      case '6M':
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        from = sixMonthsAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        displayResolution = '1D';
        break;
        
      case 'YTD':
        from = `${now.getFullYear()}-01-01`;
        multiplier = 1;
        resolution = 'day';
        displayResolution = '1D';
        break;
        
      case '1Y':
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        from = oneYearAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        displayResolution = '1D';
        break;
        
      case '2Y':
        const twoYearsAgo = new Date(now);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        from = twoYearsAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'day';
        displayResolution = '1D';
        break;
        
      default:
        const defaultAgo = new Date(now);
        defaultAgo.setMonth(defaultAgo.getMonth() - 1);
        from = defaultAgo.toISOString().split('T')[0];
        multiplier = 1;
        resolution = 'hour';
        displayResolution = '1H';
    }

    const initialUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${multiplier}/${resolution}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${apiKey}`;
    
    console.log(`Fetching ${ticker} ${timeframe}`);

    const allResults = await fetchAllData(initialUrl, apiKey);

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

    const uniqueCandles = candles.filter((candle: any, index: number, arr: any[]) => 
      index === 0 || candle.time !== arr[index - 1].time
    );

    console.log(`Returning ${uniqueCandles.length} candles for ${ticker}`);

    const result = { 
      candles: uniqueCandles,
      ticker,
      timeframe,
      resolution: displayResolution,
      totalBars: uniqueCandles.length
    };

    serverCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return createSuccessResponse(result);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
    console.error('Error:', errorMessage);
    
    if ((error as Error).name === 'AbortError') {
      return createErrorResponse('Request timeout', 504);
    }
    
    return createErrorResponse('An error occurred', 500);
  }
});
