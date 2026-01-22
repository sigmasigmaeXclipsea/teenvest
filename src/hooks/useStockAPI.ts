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

export const fetchStockQuote = async (symbol: string): Promise<StockQuote> => {
  const res = await fetch(`${API_BASE_URL}/${symbol.toUpperCase()}`);
  if (!res.ok) throw new Error("Fetch failed");

  const data = await res.json();

  const price = data?.quote?.c;
  if (price == null) throw new Error("Missing price");

  return {
    symbol: data.profile?.ticker || symbol.toUpperCase(),
    companyName: data.profile?.name || symbol.toUpperCase(),
    price,
    change: data.quote?.d ?? 0,
    changePercent: data.quote?.dp ?? 0,
    high: data.quote?.h ?? 0,
    low: data.quote?.l ?? 0,
    open: data.quote?.o ?? 0,
    previousClose: data.quote?.pc ?? 0,
    volume: data.quote?.v ?? 0,
    marketCap: (data.profile?.marketCapitalization ?? 0) * 1_000_000,
    logo: data.profile?.logo,
    sector: data.profile?.finnhubIndustry,
    exchange: data.profile?.exchange,
    country: data.profile?.country,
    ipo: data.profile?.ipo,
    weburl: data.profile?.weburl,
    shareOutstanding: data.profile?.shareOutstanding,
  };
};

export const useStockQuote = (symbol: string) =>
  useQuery({
    queryKey: ["stock", symbol],
    queryFn: () => fetchStockQuote(symbol),
    enabled: !!symbol,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

export const useSearchStock = () =>
  useMutation({
    mutationFn: (symbol: string) => fetchStockQuote(symbol),
  });

export const useMultipleStockQuotes = (symbols: string[]) =>
  useQuery({
    queryKey: ["stocks", symbols.join(",")],
    queryFn: async () => {
      const results = await Promise.allSettled(
        symbols.map((s) => fetchStockQuote(s))
      );
      return results
        .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === "fulfilled")
        .map((r) => r.value);
    },
    enabled: symbols.length > 0,
    staleTime: 30000,
    gcTime: 60000,
  });
