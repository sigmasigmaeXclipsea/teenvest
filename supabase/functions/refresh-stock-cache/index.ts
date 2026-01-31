import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  rateLimitByIP, 
  RateLimitConfig, 
  validateSymbol,
  secureCorsHeaders,
  createRateLimitResponse,
  createErrorResponse,
  createSuccessResponse
} from "../_shared/security.ts";

// Very strict rate limiting for this service endpoint
const rateLimitConfig: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 5 };

const FINNHUB_API_BASE = "https://finnhub-stock-api-5xrj.onrender.com/api/stock";

// Popular tickers to always keep fresh
const POPULAR_TICKERS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "JNJ",
  "V", "PG", "UNH", "HD", "MA", "DIS", "PYPL", "ADBE", "NFLX", "CRM",
  "INTC", "VZ", "KO", "PEP", "CSCO", "ABT", "MRK", "CMCSA", "XOM", "CVX"
];

interface StockData {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string | null;
  high: number;
  low: number;
}

async function fetchStockData(symbol: string): Promise<StockData | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(`${FINNHUB_API_BASE}/${encodeURIComponent(symbol)}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!res.ok) {
      console.log(`Failed to fetch ${symbol}: ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    const price = data?.quote?.c;
    
    if (price == null || typeof price !== "number") {
      console.log(`No price for ${symbol}`);
      return null;
    }
    
    return {
      symbol: data.profile?.ticker || symbol,
      companyName: data.profile?.name || symbol,
      price,
      change: Number(data.quote?.d) || 0,
      changePercent: Number(data.quote?.dp) || 0,
      volume: Number(data.quote?.v) || 0,
      marketCap: (Number(data.profile?.marketCapitalization) || 0) * 1_000_000,
      sector: data.profile?.finnhubIndustry || null,
      high: Number(data.quote?.h) || 0,
      low: Number(data.quote?.l) || 0,
    };
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.log(`Timeout fetching ${symbol}`);
    } else {
      console.error(`Error fetching ${symbol}:`, error);
    }
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: secureCorsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }

  try {
    // IP-based rate limiting for this internal service
    const rateLimitResult = rateLimitByIP(req, rateLimitConfig);
    if (!rateLimitResult.allowed) {
      console.warn('Rate limit exceeded for refresh-stock-cache');
      return createRateLimitResponse(rateLimitResult.resetTime!);
    }

    // Validate request size
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 5120) {
      return createErrorResponse('Request too large', 413);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return createErrorResponse('Service configuration error', 503);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for custom symbols, or use popular tickers
    let symbolsToFetch = POPULAR_TICKERS;
    
    try {
      const body = await req.json();
      if (body.symbols && Array.isArray(body.symbols)) {
        // Validate and limit custom symbols
        const validSymbols = body.symbols
          .slice(0, 20) // Limit to 20 custom symbols
          .map((s: unknown) => validateSymbol(s))
          .filter((s: string | null): s is string => s !== null);
        
        symbolsToFetch = [...new Set([...validSymbols, ...POPULAR_TICKERS.slice(0, 10)])];
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Limit total symbols
    symbolsToFetch = symbolsToFetch.slice(0, 30);

    console.log(`Refreshing cache for ${symbolsToFetch.length} symbols`);

    // Fetch in batches to avoid rate limits
    const batchSize = 5;
    const results: StockData[] = [];
    
    for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
      const batch = symbolsToFetch.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(symbol => fetchStockData(symbol))
      );
      
      batchResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          results.push(result.value);
        }
      });
      
      // Small delay between batches
      if (i + batchSize < symbolsToFetch.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`Fetched ${results.length} stocks successfully`);

    // Upsert to cache
    if (results.length > 0) {
      const cacheData = results.map(stock => ({
        symbol: stock.symbol,
        company_name: stock.companyName,
        price: stock.price,
        change: stock.change,
        change_percent: stock.changePercent,
        volume: Math.round(stock.volume),
        market_cap: Math.round(stock.marketCap),
        sector: stock.sector,
        high: stock.high,
        low: stock.low,
        cached_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("stock_cache")
        .upsert(cacheData, { onConflict: "symbol" });

      if (error) {
        console.error("Cache upsert error:", error);
        throw error;
      }
      
      console.log(`Cached ${cacheData.length} stocks`);
    }

    return createSuccessResponse({ 
      success: true, 
      cached: results.length,
      symbols: results.map(r => r.symbol)
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return createErrorResponse("An error occurred", 500);
  }
});
