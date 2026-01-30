import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const API_BASE_URL = "https://finnhub-stock-api-5xrj.onrender.com/api/stock";

export interface CandlestickData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimePeriod = '1d' | '5d' | '1m' | '3m' | '6m' | 'ytd' | '1y' | '2y';

const periodToBackendTimeframe = (period: TimePeriod): '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '2Y' => {
  switch (period) {
    case '1d': return '1D';
    case '5d': return '5D';
    case '1m': return '1M';
    case '3m': return '3M';
    case '6m': return '6M';
    case 'ytd': return 'YTD';
    case '1y': return '1Y';
    case '2y': return '2Y';
  }
};

const safeNumber = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

// Request throttling to prevent abuse
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 30;
const THROTTLE_WINDOW_MS = 60 * 1000;

const isThrottled = (): boolean => {
  const now = Date.now();
  // Remove old timestamps
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - THROTTLE_WINDOW_MS) {
    requestTimestamps.shift();
  }
  return requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE;
};

const trackRequest = () => {
  requestTimestamps.push(Date.now());
};

// Fetch candlestick data from backend candles function
export const fetchCandlestickData = async (
  symbol: string,
  period: TimePeriod
): Promise<CandlestickData[]> => {
  if (!symbol || typeof symbol !== 'string') {
    throw new Error("Invalid symbol");
  }

  const cleanSymbol = symbol.trim().toUpperCase();
  if (!/^[A-Z]{1,5}$/.test(cleanSymbol)) {
    throw new Error("Invalid symbol format");
  }

  // Client-side throttling
  if (isThrottled()) {
    throw new Error("Too many requests. Please wait a moment.");
  }
  trackRequest();

  const timeframe = periodToBackendTimeframe(period);
  const { data, error } = await supabase.functions.invoke('polygon-candles', {
    body: { ticker: cleanSymbol, timeframe },
  });

  if (error) {
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    throw new Error(error.message || 'Failed to load candlestick data');
  }

  const candlesRaw = (data as any)?.candles;
  if (!Array.isArray(candlesRaw) || candlesRaw.length === 0) return [];

  // Normalize + hard-null-safety
  const normalized: CandlestickData[] = candlesRaw
    .map((c: any) => {
      const t = safeNumber(c?.time);
      const o = safeNumber(c?.open);
      const h = safeNumber(c?.high);
      const l = safeNumber(c?.low);
      const cl = safeNumber(c?.close);
      const v = safeNumber(c?.volume) ?? 0;

      if (t == null || o == null || h == null || l == null || cl == null) return null;
      if (t <= 0) return null;

      return { time: Math.floor(t), open: o, high: h, low: l, close: cl, volume: v };
    })
    .filter((x: CandlestickData | null): x is CandlestickData => x !== null)
    .sort((a, b) => a.time - b.time);

  // De-dupe by time
  const deduped: CandlestickData[] = [];
  const seen = new Set<number>();
  for (const c of normalized) {
    if (seen.has(c.time)) continue;
    seen.add(c.time);
    deduped.push(c);
  }

  return deduped;
};

// Hook to fetch candlestick data
export const useCandlestickData = (symbol: string, period: TimePeriod) => {
  return useQuery({
    queryKey: ["candlestick", symbol, period],
    queryFn: () => fetchCandlestickData(symbol, period),
    enabled: !!symbol && typeof symbol === 'string' && symbol.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors
      if (error?.message?.includes('rate limit') || error?.message?.includes('Too many')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export interface StockQuote {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume?: number;
  marketCap?: number;
  logo?: string;
  sector?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  exchange?: string;
  country?: string;
  ipo?: string;
  weburl?: string;
  shareOutstanding?: number;
}

// Validate stock symbol format: 1-5 uppercase letters only
const isValidSymbol = (symbol: string): boolean => {
  return /^[A-Z]{1,5}$/.test(symbol);
};

// Cache for stock quotes to reduce duplicate requests
const quoteCache = new Map<string, { data: StockQuote; timestamp: number }>();
const QUOTE_CACHE_TTL = 30 * 1000; // 30 seconds

export const fetchStockQuote = async (symbol: string): Promise<StockQuote> => {
  if (!symbol || typeof symbol !== 'string') {
    throw new Error("Please enter a valid stock symbol");
  }
  
  const cleanSymbol = symbol.trim().toUpperCase();
  if (!cleanSymbol) {
    throw new Error("Please enter a stock symbol");
  }

  // Strict regex validation to prevent injection attacks
  if (!isValidSymbol(cleanSymbol)) {
    throw new Error("Invalid symbol format. Use 1-5 letters (e.g., AAPL, TSLA)");
  }

  // Check client-side cache first
  const cached = quoteCache.get(cleanSymbol);
  if (cached && Date.now() - cached.timestamp < QUOTE_CACHE_TTL) {
    return cached.data;
  }

  // Client-side throttling
  if (isThrottled()) {
    throw new Error("Too many requests. Please wait a moment.");
  }
  trackRequest();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(cleanSymbol)}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment.");
      }
      throw new Error("Unable to fetch stock data");
    }

    const data = await res.json();

    const price = data?.quote?.c;
    if (price == null || typeof price !== 'number') {
      throw new Error("Missing price");
    }

    const result: StockQuote = {
      symbol: data.profile?.ticker || cleanSymbol,
      companyName: data.profile?.name || cleanSymbol,
      price,
      change: Number(data.quote?.d) || 0,
      changePercent: Number(data.quote?.dp) || 0,
      high: Number(data.quote?.h) || 0,
      low: Number(data.quote?.l) || 0,
      open: Number(data.quote?.o) || 0,
      previousClose: Number(data.quote?.pc) || 0,
      volume: Number(data.quote?.v) || 0,
      marketCap: (Number(data.profile?.marketCapitalization) || 0) * 1_000_000,
      logo: data.profile?.logo || undefined,
      sector: data.profile?.finnhubIndustry || undefined,
      exchange: data.profile?.exchange || undefined,
      country: data.profile?.country || undefined,
      ipo: data.profile?.ipo || undefined,
      weburl: data.profile?.weburl || undefined,
      shareOutstanding: Number(data.profile?.shareOutstanding) || undefined,
    };

    // Cache the result
    quoteCache.set(cleanSymbol, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    clearTimeout(timeout);
    if ((error as Error).name === 'AbortError') {
      throw new Error("Request timeout. Please try again.");
    }
    throw error;
  }
};

export const useStockQuote = (symbol: string) =>
  useQuery({
    queryKey: ["stock", symbol],
    queryFn: () => fetchStockQuote(symbol),
    enabled: !!symbol && typeof symbol === 'string' && symbol.trim().length > 0,
    staleTime: 60000, // Consider fresh for 60s
    gcTime: 300000, // Keep in cache for 5min
    refetchInterval: 90000, // Refetch every 90s (reduced from 60s)
    refetchOnWindowFocus: false, // Don't refetch on focus
    retry: (failureCount, error) => {
      if (error?.message?.includes('rate limit') || error?.message?.includes('Too many')) {
        return false;
      }
      return failureCount < 1;
    },
  });

export const useSearchStock = () =>
  useMutation({
    mutationFn: (symbol: string) => {
      if (!symbol || typeof symbol !== 'string') {
        return Promise.reject(new Error("Invalid symbol"));
      }
      return fetchStockQuote(symbol.trim().toUpperCase());
    },
  });

export const useMultipleStockQuotes = (symbols: string[]) =>
  useQuery({
    queryKey: ["stocks", symbols.join(",")],
    queryFn: async () => {
      // Filter out invalid symbols first
      const validSymbols = symbols.filter(s => s && typeof s === 'string' && s.trim().length > 0);
      if (validSymbols.length === 0) return [];
      
      // Limit to prevent abuse
      const limitedSymbols = validSymbols.slice(0, 20);
      
      const results = await Promise.allSettled(
        limitedSymbols.map((s) => fetchStockQuote(s))
      );
      return results
        .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === "fulfilled")
        .map((r) => r.value);
    },
    enabled: Array.isArray(symbols) && symbols.length > 0,
    staleTime: 60000, // 60s stale time
    gcTime: 300000, // 5min cache
    refetchOnWindowFocus: false,
    retry: 1,
  });
