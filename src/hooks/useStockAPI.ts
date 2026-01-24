import { useQuery, useMutation } from "@tanstack/react-query";

const API_BASE_URL = "https://finnhub-stock-api-5xrj.onrender.com/api/stock";
const MASSIVE_API_KEY = "uWZTNdXVOI0ZapBgRtGnw1PtVlPw8XZI";
const MASSIVE_API_BASE = "https://api.massive.com/v2/aggs/ticker";

export interface CandlestickData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type TimePeriod = '1d' | '5d' | '1m' | 'ytd' | '1y';

// Calculate FROM and TO timestamps for Massive.com API
const getTimeRange = (period: TimePeriod): { from: number; to: number } => {
  const now = Date.now();
  const to = now;
  let from: number;

  switch (period) {
    case '1d':
      from = now - (1 * 24 * 60 * 60 * 1000); // 1 day ago
      break;
    case '5d':
      from = now - (5 * 24 * 60 * 60 * 1000); // 5 days ago
      break;
    case '1m':
      from = now - (30 * 24 * 60 * 60 * 1000); // ~30 days ago
      break;
    case 'ytd':
      const yearStart = new Date(new Date().getFullYear(), 0, 1);
      from = yearStart.getTime();
      break;
    case '1y':
      from = now - (365 * 24 * 60 * 60 * 1000); // 1 year ago
      break;
    default:
      from = now - (30 * 24 * 60 * 60 * 1000);
  }

  return { from, to };
};

// Fetch candlestick data from Massive.com
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

  const { from, to } = getTimeRange(period);
  const url = `${MASSIVE_API_BASE}/${cleanSymbol}/range/1/day/${from}/${to}?adjusted=true&sort=asc&apiKey=${MASSIVE_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch candlestick data: ${res.statusText}`);
  }

  const data = await res.json();

  // Handle different possible response formats
  let results: any[] = [];
  
  if (data?.results && Array.isArray(data.results)) {
    // Polygon.io / Massive.com format: { results: [{ t, o, h, l, c, v }] }
    results = data.results;
  } else if (Array.isArray(data)) {
    // Direct array format: [{ t, o, h, l, c, v }]
    results = data;
  } else if (data?.data && Array.isArray(data.data)) {
    // Alternative format: { data: [...] }
    results = data.data;
  } else {
    throw new Error("Invalid API response format - expected results array");
  }

  if (results.length === 0) {
    return []; // Return empty array if no data
  }

  return results.map((item: any) => {
    // Handle different field name formats
    const timestamp = item.t || item.timestamp || item.time;
    const open = item.o || item.open;
    const high = item.h || item.high;
    const low = item.l || item.low;
    const close = item.c || item.close;
    const volume = item.v || item.volume || 0;

    // Convert timestamp to seconds (assume ms if > 1e10, otherwise seconds)
    const timeInSeconds = timestamp > 1e10 
      ? Math.floor(timestamp / 1000) 
      : Math.floor(timestamp);

    return {
      time: timeInSeconds,
      open: Number(open) || 0,
      high: Number(high) || 0,
      low: Number(low) || 0,
      close: Number(close) || 0,
      volume: Number(volume) || 0,
    };
  }).filter((candle: CandlestickData) => candle.time > 0 && candle.close > 0);
};

// Hook to fetch candlestick data
export const useCandlestickData = (symbol: string, period: TimePeriod) => {
  return useQuery({
    queryKey: ["candlestick", symbol, period],
    queryFn: () => fetchCandlestickData(symbol, period),
    enabled: !!symbol && typeof symbol === 'string' && symbol.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
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

  const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(cleanSymbol)}`);
  if (!res.ok) throw new Error("Unable to fetch stock data");

  const data = await res.json();

  const price = data?.quote?.c;
  if (price == null || typeof price !== 'number') {
    throw new Error("Missing price");
  }

  return {
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
};

export const useStockQuote = (symbol: string) =>
  useQuery({
    queryKey: ["stock", symbol],
    queryFn: () => fetchStockQuote(symbol),
    enabled: !!symbol && typeof symbol === 'string' && symbol.trim().length > 0,
    staleTime: 60000, // Consider fresh for 60s (reduced API calls)
    gcTime: 300000, // Keep in cache for 5min
    refetchInterval: 60000, // Refetch every 60s instead of 30s (less aggressive)
    refetchOnWindowFocus: false, // Don't refetch on focus (reduces unnecessary calls)
    retry: 1,
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
      
      const results = await Promise.allSettled(
        validSymbols.map((s) => fetchStockQuote(s))
      );
      return results
        .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === "fulfilled")
        .map((r) => r.value);
    },
    enabled: Array.isArray(symbols) && symbols.length > 0,
    staleTime: 60000, // 60s stale time
    gcTime: 300000, // 5min cache
    refetchOnWindowFocus: false, // Don't refetch on focus
    retry: 1,
  });
