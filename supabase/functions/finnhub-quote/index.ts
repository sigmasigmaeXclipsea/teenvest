import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  rateLimitByIP, 
  validateSymbol, 
  secureCorsHeaders,
  createRateLimitResponse,
  createErrorResponse,
  createSuccessResponse
} from "../_shared/security.ts";

// Strict rate limiting for public endpoint - 20 requests per minute per IP
const RATE_LIMIT_CONFIG = { windowMs: 60 * 1000, maxRequests: 20 };

// Server-side cache
const serverCache = new Map<string, { data: any; timestamp: number }>();
const SERVER_CACHE_TTL = 60000; // 60 second server cache

interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // Day high
  l: number; // Day low
  o: number; // Open price
  pc: number; // Previous close price
}

interface FinnhubProfile {
  currency: string;
  description: string;
  exchange: string;
  finnhubIndustry: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: secureCorsHeaders });
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // IP-based rate limiting for this public endpoint
    const rateLimitResult = rateLimitByIP(req, RATE_LIMIT_CONFIG);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP-based request`);
      return createRateLimitResponse(rateLimitResult.resetTime!);
    }

    // Validate request body size (max 1KB for this endpoint)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024) {
      return createErrorResponse('Request too large', 413);
    }

    const body = await req.json();
    
    // Strict symbol validation
    const ticker = validateSymbol(body?.ticker);
    if (!ticker) {
      return createErrorResponse('Invalid ticker symbol. Use 1-5 uppercase letters.', 400);
    }

    // Check cache first
    const cacheKey = `quote-${ticker}`;
    const cached = serverCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SERVER_CACHE_TTL) {
      console.log(`Cache hit for ${ticker}`);
      return createSuccessResponse(cached.data);
    }

    const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');
    
    if (!FINNHUB_API_KEY) {
      console.error('FINNHUB_API_KEY is not configured');
      return createErrorResponse('Service temporarily unavailable', 503);
    }
    
    // Fetch quote and profile data with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const [quoteResponse, profileResponse] = await Promise.all([
        fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`, {
          signal: controller.signal
        }),
        fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`, {
          signal: controller.signal
        })
      ]);

      clearTimeout(timeout);

      if (!quoteResponse.ok || !profileResponse.ok) {
        return createErrorResponse('Failed to fetch stock data', 502);
      }

      const quote: FinnhubQuote = await quoteResponse.json() as FinnhubQuote;
      const profile: FinnhubProfile = await profileResponse.json() as FinnhubProfile;

      // Validate we got valid data
      if (typeof quote?.c !== 'number' || quote.c <= 0) {
        return createErrorResponse('Stock not found or no price data available', 404);
      }

      // Calculate change percentage and format
      const changePercent = quote.dp?.toFixed(2) || '0.00';
      const change = quote.d?.toFixed(2) || '0.00';
      const price = quote.c?.toFixed(2) || '0.00';

      const result = {
        symbol: ticker,
        name: profile.name || ticker,
        price: parseFloat(price),
        change: change.startsWith('-') ? change : `+${change}`,
        changePercent: changePercent.startsWith('-') ? changePercent : `+${changePercent}`,
        isPositive: parseFloat(change) >= 0,
        currency: profile.currency || 'USD',
        dayHigh: quote.h || 0,
        dayLow: quote.l || 0,
        openPrice: quote.o || 0,
        volume: 0,
      };

      // Cache the result
      serverCache.set(cacheKey, { data: result, timestamp: Date.now() });

      return createSuccessResponse(result);
    } catch (fetchError) {
      clearTimeout(timeout);
      if ((fetchError as Error).name === 'AbortError') {
        return createErrorResponse('Request timeout', 504);
      }
      throw fetchError;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return createErrorResponse('An error occurred', 500);
  }
});
