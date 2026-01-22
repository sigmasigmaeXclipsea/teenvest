import { useQuery, useMutation } from "@tanstack/react-query";

const API_BASE_URL = "https://finnhub-stock-api-5xrj.onrender.com/api/stock";

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
    staleTime: 30000,
    gcTime: 60000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
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
    staleTime: 30000,
    gcTime: 60000,
    retry: 1,
  });
