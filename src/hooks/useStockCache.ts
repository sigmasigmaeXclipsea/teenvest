import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StockQuote } from "./useStockAPI";

export interface CachedStock {
  id: string;
  symbol: string;
  company_name: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  market_cap: number;
  sector: string | null;
  high: number;
  low: number;
  cached_at: string;
}

// Convert cached stock to StockQuote format
export const cachedToQuote = (cached: CachedStock): StockQuote => ({
  symbol: cached.symbol,
  companyName: cached.company_name,
  price: cached.price,
  change: cached.change,
  changePercent: cached.change_percent,
  volume: cached.volume,
  marketCap: cached.market_cap,
  sector: cached.sector || undefined,
  high: cached.high,
  low: cached.low,
  open: 0,
  previousClose: 0,
});

// Fetch all cached stocks
export const useCachedStocks = () =>
  useQuery({
    queryKey: ["stock-cache"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_cache")
        .select("*")
        .order("cached_at", { ascending: false });

      if (error) throw error;
      return (data || []) as CachedStock[];
    },
    staleTime: 30000, // Consider fresh for 30 seconds
    gcTime: 60000,
  });

// Fetch specific cached stocks by symbols
export const useCachedStocksBySymbols = (symbols: string[]) =>
  useQuery({
    queryKey: ["stock-cache", symbols.join(",")],
    queryFn: async () => {
      if (symbols.length === 0) return [];
      
      const { data, error } = await supabase
        .from("stock_cache")
        .select("*")
        .in("symbol", symbols);

      if (error) throw error;
      return (data || []) as CachedStock[];
    },
    enabled: symbols.length > 0,
    staleTime: 30000,
  });

// Trigger cache refresh via edge function
export const useRefreshStockCache = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (symbols?: string[]) => {
      const { data, error } = await supabase.functions.invoke("refresh-stock-cache", {
        body: symbols ? { symbols } : {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate cache query to refetch
      queryClient.invalidateQueries({ queryKey: ["stock-cache"] });
    },
  });
};

// Check if cache is stale (older than X minutes)
export const isCacheStale = (cachedAt: string, minutesThreshold = 5): boolean => {
  const cacheTime = new Date(cachedAt).getTime();
  const now = Date.now();
  return now - cacheTime > minutesThreshold * 60 * 1000;
};
