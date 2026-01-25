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

interface RequestBody {
  ticker: string;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json() as RequestBody;
    const { ticker } = body;
    
    if (!ticker) {
      throw new Error('Ticker symbol is required');
    }

    // Check cache first
    const cacheKey = `quote-${ticker}`;
    const cached = serverCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SERVER_CACHE_TTL) {
      console.log(`Cache hit for ${ticker}`);
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const FINNHUB_API_KEY = 'd4ef1bpr01qrumpf5ojgd4ef1bpr01qrumpf5ok0';
    
    // Fetch quote and profile data
    const [quoteResponse, profileResponse] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`)
    ]);

    if (!quoteResponse.ok || !profileResponse.ok) {
      throw new Error('Failed to fetch data from Finnhub API');
    }

    const quote: FinnhubQuote = await quoteResponse.json() as FinnhubQuote;
    const profile: FinnhubProfile = await profileResponse.json() as FinnhubProfile;

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
      volume: 0, // Not available in quote endpoint
    };

    // Cache the result
    serverCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
