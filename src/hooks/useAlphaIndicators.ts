import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type IndicatorTimeframe = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "2Y" | "YTD";

export interface IndicatorPoint {
  time: number;
  value: number;
}

export interface MacdPoint {
  time: number;
  value: number;
  signal: number;
  hist: number;
}

export interface AlphaIndicatorsResponse {
  ticker: string;
  timeframe: IndicatorTimeframe;
  interval: string;
  rsi: { period: number; values: IndicatorPoint[] };
  ema: { period: number; values: IndicatorPoint[] };
  macd: { fastPeriod: number; slowPeriod: number; signalPeriod: number; values: MacdPoint[] };
}

export interface AlphaIndicatorOptions {
  emaPeriod?: number;
}

const isValidSymbol = (symbol: string): boolean => /^[A-Z]{1,5}$/.test(symbol);
const EMA_MIN_PERIOD = 5;
const EMA_MAX_PERIOD = 200;
const DEFAULT_EMA_PERIOD = 20;

const normalizeEmaPeriod = (raw?: number) => {
  const parsed = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_EMA_PERIOD;
  const rounded = Math.round(parsed);
  if (rounded < EMA_MIN_PERIOD) return EMA_MIN_PERIOD;
  if (rounded > EMA_MAX_PERIOD) return EMA_MAX_PERIOD;
  return rounded;
};

export const fetchAlphaIndicators = async (
  symbol: string,
  timeframe: IndicatorTimeframe,
  options: AlphaIndicatorOptions = {}
): Promise<AlphaIndicatorsResponse> => {
  if (!symbol || typeof symbol !== "string") {
    throw new Error("Invalid symbol");
  }
  const cleanSymbol = symbol.trim().toUpperCase();
  if (!isValidSymbol(cleanSymbol)) {
    throw new Error("Invalid symbol format");
  }

  const emaPeriod = normalizeEmaPeriod(options.emaPeriod);
  const { data, error } = await supabase.functions.invoke("alpha-indicators", {
    body: { ticker: cleanSymbol, timeframe, emaPeriod },
  });
  if (error) {
    throw new Error(error.message || "Failed to load indicator data");
  }
  if (!data || (data as any)?.error) {
    throw new Error((data as any)?.error || "Indicator service unavailable");
  }

  return data as AlphaIndicatorsResponse;
};

export const useAlphaIndicators = (
  symbol: string,
  timeframe: IndicatorTimeframe = "1M",
  options: AlphaIndicatorOptions = {}
) =>
  useQuery({
    queryKey: ["alpha-indicators", symbol, timeframe, normalizeEmaPeriod(options.emaPeriod)],
    queryFn: () => fetchAlphaIndicators(symbol, timeframe, options),
    enabled: !!symbol && typeof symbol === "string" && symbol.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });
