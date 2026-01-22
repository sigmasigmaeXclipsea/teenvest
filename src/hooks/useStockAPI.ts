import { useQuery } from "@tanstack/react-query";

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
  };
};

export const useStockQuote = (symbol: string) =>
  useQuery({
    queryKey: ["stock", symbol],
    queryFn: () => fetchStockQuote(symbol),
    enabled: !!symbol,
    staleTime: 0,
    cacheTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
