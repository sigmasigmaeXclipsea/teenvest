import { useQuery } from "@tanstack/react-query";
import { fetchCandlestickData, type CandlestickData, type TimePeriod } from "@/hooks/useStockAPI";

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
const RSI_PERIOD = 14;
const MACD_FAST_PERIOD = 12;
const MACD_SLOW_PERIOD = 26;
const MACD_SIGNAL_PERIOD = 9;

const normalizeEmaPeriod = (raw?: number) => {
  const parsed = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_EMA_PERIOD;
  const rounded = Math.round(parsed);
  if (rounded < EMA_MIN_PERIOD) return EMA_MIN_PERIOD;
  if (rounded > EMA_MAX_PERIOD) return EMA_MAX_PERIOD;
  return rounded;
};

const timeframeToPeriod = (timeframe: IndicatorTimeframe): TimePeriod => {
  switch (timeframe) {
    case "1D":
      return "1d";
    case "5D":
      return "5d";
    case "1M":
      return "1m";
    case "3M":
      return "3m";
    case "6M":
      return "6m";
    case "YTD":
      return "ytd";
    case "1Y":
      return "1y";
    case "2Y":
      return "2y";
    default:
      return "1m";
  }
};

const timeframeToInterval = (timeframe: IndicatorTimeframe): string => {
  switch (timeframe) {
    case "1D":
      return "5min";
    case "5D":
      return "15min";
    case "1M":
    case "3M":
      return "60min";
    case "6M":
    case "1Y":
    case "2Y":
    case "YTD":
      return "daily";
    default:
      return "daily";
  }
};

const toClosePoints = (candles: CandlestickData[]): IndicatorPoint[] =>
  [...candles]
    .map((c) => ({ time: c.time, value: c.close }))
    .filter((p) => Number.isFinite(p.time) && Number.isFinite(p.value))
    .sort((a, b) => a.time - b.time);

const calculateEmaFromPoints = (
  points: IndicatorPoint[],
  period: number
): IndicatorPoint[] => {
  const sorted = [...points].filter((p) => Number.isFinite(p.value));
  if (sorted.length < period) return [];
  sorted.sort((a, b) => a.time - b.time);
  const multiplier = 2 / (period + 1);

  let sum = 0;
  for (let i = 0; i < period; i += 1) {
    sum += sorted[i].value;
  }
  let ema = sum / period;
  const output: IndicatorPoint[] = [
    { time: sorted[period - 1].time, value: ema },
  ];

  for (let i = period; i < sorted.length; i += 1) {
    const price = sorted[i].value;
    ema = (price - ema) * multiplier + ema;
    if (Number.isFinite(ema)) {
      output.push({ time: sorted[i].time, value: ema });
    }
  }

  return output;
};

const calculateRsiFromPoints = (
  points: IndicatorPoint[],
  period: number
): IndicatorPoint[] => {
  const sorted = [...points].filter((p) => Number.isFinite(p.value));
  if (sorted.length <= period) return [];
  sorted.sort((a, b) => a.time - b.time);

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = sorted[i].value - sorted[i - 1].value;
    if (change >= 0) {
      gainSum += change;
    } else {
      lossSum += -change;
    }
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  const toRsi = () => {
    if (avgLoss === 0 && avgGain === 0) return 50;
    if (avgLoss === 0) return 100;
    if (avgGain === 0) return 0;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  };

  const output: IndicatorPoint[] = [{ time: sorted[period].time, value: toRsi() }];

  for (let i = period + 1; i < sorted.length; i += 1) {
    const change = sorted[i].value - sorted[i - 1].value;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    output.push({ time: sorted[i].time, value: toRsi() });
  }

  return output.filter((p) => Number.isFinite(p.value));
};

const calculateMacdFromPoints = (
  points: IndicatorPoint[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number
): MacdPoint[] => {
  const fastEma = calculateEmaFromPoints(points, fastPeriod);
  const slowEma = calculateEmaFromPoints(points, slowPeriod);
  if (fastEma.length === 0 || slowEma.length === 0) return [];

  const slowMap = new Map(slowEma.map((p) => [p.time, p.value]));
  const macdLine = fastEma
    .map((p) => {
      const slow = slowMap.get(p.time);
      if (slow == null) return null;
      return { time: p.time, value: p.value - slow };
    })
    .filter((p): p is IndicatorPoint => p !== null && Number.isFinite(p.value));

  const signalLine = calculateEmaFromPoints(macdLine, signalPeriod);
  const signalMap = new Map(signalLine.map((p) => [p.time, p.value]));

  return macdLine
    .map((p) => {
      const signal = signalMap.get(p.time);
      if (signal == null) return null;
      const hist = p.value - signal;
      if (!Number.isFinite(hist)) return null;
      return { time: p.time, value: p.value, signal, hist };
    })
    .filter((p): p is MacdPoint => p !== null);
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
  let localCandles: CandlestickData[] = [];
  try {
    localCandles = await fetchCandlestickData(
      cleanSymbol,
      timeframeToPeriod(timeframe)
    );
  } catch (error) {
    console.warn("Indicator candles unavailable:", error);
    localCandles = [];
  }

  const closePoints = toClosePoints(localCandles);
  const emaValues = calculateEmaFromPoints(closePoints, emaPeriod);
  const rsiValues = calculateRsiFromPoints(closePoints, RSI_PERIOD);
  const macdValues = calculateMacdFromPoints(
    closePoints,
    MACD_FAST_PERIOD,
    MACD_SLOW_PERIOD,
    MACD_SIGNAL_PERIOD
  );

  return {
    ticker: cleanSymbol,
    timeframe,
    interval: timeframeToInterval(timeframe),
    rsi: { period: RSI_PERIOD, values: rsiValues },
    ema: { period: emaPeriod, values: emaValues },
    macd: {
      fastPeriod: MACD_FAST_PERIOD,
      slowPeriod: MACD_SLOW_PERIOD,
      signalPeriod: MACD_SIGNAL_PERIOD,
      values: macdValues,
    },
  };
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
