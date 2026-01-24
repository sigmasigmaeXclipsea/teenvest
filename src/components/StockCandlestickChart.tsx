import { useMemo, useState, useRef, useEffect, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createChart, ColorType } from "lightweight-charts";
import { supabase } from '@/integrations/supabase/client';

interface CandleData {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface StockCandlestickChartProps {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  high: number;
  low: number;
  open: number;
}

type TimePeriod = '1d' | '5d' | '1m' | 'ytd' | '1y';

type ApiTimeframe = '1D' | '5D' | '1M' | 'YTD' | '1Y';

const toApiTimeframe = (tp: TimePeriod): ApiTimeframe => {
  switch (tp) {
    case '1d':
      return '1D';
    case '5d':
      return '5D';
    case '1m':
      return '1M';
    case 'ytd':
      return 'YTD';
    case '1y':
      return '1Y';
  }
};

// Client-side cache for chart candles
const candleCache = new Map<string, { data: CandleData[]; timestamp: number }>();
const CACHE_TTL = 60_000;

// Candlestick chart renderer using lightweight-charts
const CandlestickChartRenderer = ({ 
  candleData, 
  minPrice, 
  maxPrice, 
  previousClose,
  timePeriod 
}: { 
  candleData: CandleData[]; 
  minPrice: number; 
  maxPrice: number; 
  previousClose: number;
  timePeriod: TimePeriod;
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el || !candleData || candleData.length === 0) return;

    // Guard against hidden tabs (width=0) which can cause lightweight-charts to throw.
    const width = el.clientWidth;
    if (!width || width <= 0) return;

    // Clear any previous instance if effect re-runs.
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch {
        // ignore
      }
      chartRef.current = null;
    }

    // Format data for lightweight-charts
    // NOTE: We already store unix seconds; just sort and pass through.
    const formattedData = candleData
      .map((candle) => ({
        time: candle.time as any,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }))
      // CRITICAL: Sort by time ascending to satisfy lightweight-charts requirement
      .sort((a, b) => (a.time as number) - (b.time as number));

    // Create chart with TradingView-style professional look
    let chart: any;
    try {
      chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "hsl(var(--background))" },
        textColor: "hsl(var(--foreground))",
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      },
      grid: {
        vertLines: { 
          color: "rgba(148, 163, 184, 0.1)",
          style: 1, // Solid lines
          visible: true,
        },
        horzLines: { 
          color: "rgba(148, 163, 184, 0.1)",
          style: 1, // Solid lines
          visible: true,
        },
      },
      width,
      height: 500, // Taller for better visibility
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.3)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 6,
        minBarSpacing: 2,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.3)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        entireTextOnly: false,
      },
      leftPriceScale: {
        visible: false,
      },
      crosshair: {
        mode: 1, // Normal crosshair
        vertLine: {
          color: "rgba(148, 163, 184, 0.5)",
          width: 1,
          style: 2, // Dashed
          labelBackgroundColor: "hsl(var(--background))",
        },
        horzLine: {
          color: "rgba(148, 163, 184, 0.5)",
          width: 1,
          style: 2, // Dashed
          labelBackgroundColor: "hsl(var(--background))",
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      });
    } catch {
      return;
    }

    // Add candlestick series with TradingView colors (green/red)
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#26a69a", // TradingView green
      downColor: "#ef5350", // TradingView red
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      borderVisible: true,
    });

    // Wrap setData in try-catch to handle data ordering issues gracefully
    try {
      candlestickSeries.setData(formattedData);
    } catch (e) {
      console.error('Failed to set candlestick data:', e);
      try { chart.remove(); } catch {}
      return;
    }
    chart.timeScale().fitContent();

    // Add price line at previous close for reference (TradingView style)
    const priceLine = candlestickSeries.createPriceLine({
      price: previousClose,
      color: 'rgba(148, 163, 184, 0.4)',
      lineWidth: 1,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: 'Prev Close',
    });

    // Handle resize
    const handleResize = () => {
      const w = chartContainerRef.current?.clientWidth;
      if (w && w > 0) {
        try {
          chart.applyOptions({ width: w });
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("resize", handleResize);
    chartRef.current = chart;

    return () => {
      window.removeEventListener("resize", handleResize);
      try {
        chart.remove();
      } catch {
        // ignore
      }
    };
  }, [candleData, minPrice, maxPrice, timePeriod]);

  return <div ref={chartContainerRef} className="w-full h-[500px]" style={{ minHeight: '500px' }} />;
};

const StockCandlestickChart = ({ symbol, currentPrice, previousClose, high, low, open }: StockCandlestickChartProps) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1m');
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCandles = useCallback(async (ticker: string, tp: TimePeriod) => {
    const tf = toApiTimeframe(tp);
    const cacheKey = `${ticker}-${tf}`;
    const cached = candleCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

    const { data, error: fnError } = await supabase.functions.invoke('polygon-candles', {
      body: { ticker, timeframe: tf },
    });

    if (fnError) throw new Error(fnError.message);
    if (data?.error) throw new Error(data.error);

    const candles = (data?.candles || []) as CandleData[];
    candleCache.set(cacheKey, { data: candles, timestamp: Date.now() });
    return candles;
  }, []);
  
  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const candles = await fetchCandles(symbol, timePeriod);
        if (!cancelled) setCandleData(candles);
      } catch (e) {
        if (!cancelled) {
          setCandleData([]);
          setError(e instanceof Error ? e.message : 'Failed to load candles');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [symbol, timePeriod, fetchCandles]);

  const allPrices = candleData.length ? candleData.flatMap(c => [c.high, c.low]) : [low, high];
  const minPrice = Math.min(...allPrices) * 0.995;
  const maxPrice = Math.max(...allPrices) * 1.005;

  const periodLabels: Record<TimePeriod, string> = {
    '1d': '1 Day',
    '5d': '5 Days',
    '1m': '1 Month',
    'ytd': 'YTD',
    '1y': '1 Year'
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Candlestick Chart
          </CardTitle>
          <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <TabsList className="h-8">
              <TabsTrigger value="1d" className="text-xs px-2">1D</TabsTrigger>
              <TabsTrigger value="5d" className="text-xs px-2">5D</TabsTrigger>
              <TabsTrigger value="1m" className="text-xs px-2">1M</TabsTrigger>
              <TabsTrigger value="ytd" className="text-xs px-2">YTD</TabsTrigger>
              <TabsTrigger value="1y" className="text-xs px-2">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {loading && (
            <div className="absolute top-2 right-2 z-10 text-xs text-muted-foreground bg-background/90 backdrop-blur-sm px-2 py-1 rounded border border-border/50">
              Loading...
            </div>
          )}
          {error && !loading && candleData.length === 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-muted-foreground bg-background/60 backdrop-blur-sm rounded-md">
              {error}
            </div>
          )}
          <CandlestickChartRenderer 
            candleData={candleData}
            minPrice={minPrice}
            maxPrice={maxPrice}
            previousClose={previousClose}
            timePeriod={timePeriod}
          />
          {/* TradingView-style legend */}
          <div className="absolute top-2 left-2 flex items-center gap-3 text-xs bg-background/90 backdrop-blur-sm px-2 py-1 rounded border border-border/50">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#26a69a]"></div>
              <span className="text-muted-foreground">Bullish</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#ef5350]"></div>
              <span className="text-muted-foreground">Bearish</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(StockCandlestickChart);
