import { useState, useRef, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createChart, ColorType } from "lightweight-charts";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface CandleData {
  time: number;
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

type TimeframeOption = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '2Y';

const usesUnixTime = (t: TimeframeOption) => ['1D', '5D', '1M', '3M'].includes(t);

const toBusinessDayString = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toISOString().slice(0, 10);

const useCandlestickDataForTimeframe = (symbol: string, timeframe: TimeframeOption) => {
  return useQuery({
    queryKey: ['candlestick', symbol, timeframe],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('polygon-candles', {
        body: { ticker: symbol, timeframe },
      });
      if (error) throw error;
      return data as { candles: CandleData[]; resolution: string; totalBars: number };
    },
    staleTime: 30000,
    refetchInterval: 60000,
    enabled: !!symbol,
  });
};

const CandlestickChartRenderer = ({
  candleData,
  minPrice,
  maxPrice,
  previousClose,
  timeframe
}: {
  candleData: CandleData[];
  minPrice: number;
  maxPrice: number;
  previousClose: number;
  timeframe: TimeframeOption;
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el || !candleData || candleData.length === 0) return;

    const width = el.clientWidth;
    if (!width || width <= 0) return;

    if (chartRef.current) {
      try { chartRef.current.remove(); } catch { }
      chartRef.current = null;
    }

    const sorted = [...candleData].sort((a, b) => a.time - b.time);
    const unix = usesUnixTime(timeframe);
    const formattedData = sorted.map((c) => ({
      time: (unix ? c.time : toBusinessDayString(c.time)) as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const barSpacing = Math.max(3, Math.min(12, 800 / candleData.length));

    let chart: any;
    try {
      chart = createChart(el, {
        layout: {
          background: { type: ColorType.Solid, color: "hsl(var(--background))" },
          textColor: "hsl(var(--foreground))",
          fontSize: 12,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        grid: { vertLines: { color: "rgba(148, 163, 184, 0.1)", style: 1, visible: true }, horzLines: { color: "rgba(148, 163, 184, 0.1)", style: 1, visible: true } },
        width,
        height: 500,
        timeScale: { borderColor: "rgba(148, 163, 184, 0.3)", timeVisible: true, secondsVisible: false, rightOffset: 12, barSpacing: barSpacing, minBarSpacing: 1, fixLeftEdge: false, fixRightEdge: false },
        rightPriceScale: { borderColor: "rgba(148, 163, 184, 0.3)", scaleMargins: { top: 0.1, bottom: 0.1 }, entireTextOnly: false },
        leftPriceScale: { visible: false },
        crosshair: { mode: 1, vertLine: { color: "rgba(148, 163, 184, 0.5)", width: 1, style: 2, labelBackgroundColor: "hsl(var(--background))" }, horzLine: { color: "rgba(148, 163, 184, 0.5)", width: 1, style: 2, labelBackgroundColor: "hsl(var(--background))" } },
        handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
        handleScale: { axisPressedMouseMove: true, mouseWheel: false, pinch: true },
      });
    } catch { return; }

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#26a69a", downColor: "#ef5350", borderUpColor: "#26a69a", borderDownColor: "#ef5350", wickUpColor: "#26a69a", wickDownColor: "#ef5350", borderVisible: true,
    });

    try {
      candlestickSeries.setData(formattedData);
    } catch (e) {
      try { chart.remove(); } catch { }
      return;
    }
    try { chart.timeScale().fitContent(); } catch { }

    candlestickSeries.createPriceLine({ price: previousClose, color: 'rgba(148, 163, 184, 0.4)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'Prev Close' });

    const handleResize = () => {
      const w = chartContainerRef.current?.clientWidth;
      if (w && w > 0) { try { chart.applyOptions({ width: w }); } catch { } }
    };
    window.addEventListener("resize", handleResize);
    chartRef.current = chart;
    return () => {
      window.removeEventListener("resize", handleResize);
      try { chart.remove(); } catch { }
    };
  }, [candleData, minPrice, maxPrice, timeframe]);

  return <div ref={chartContainerRef} className="w-full h-[500px]" style={{ minHeight: '500px' }} />;
};

const StockCandlestickChart = ({ symbol, currentPrice, previousClose, high, low, open }: StockCandlestickChartProps) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('1M');
  const { data: chartData, isLoading, error } = useCandlestickDataForTimeframe(symbol, timeframe);
  const candleData = chartData?.candles || [];

  const allPrices = candleData.flatMap(c => [c.high, c.low]);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) * 0.995 : (high && low ? Math.min(high, low) * 0.995 : 0);
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) * 1.005 : (high && low ? Math.max(high, low) * 1.005 : 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Candlestick Chart
          </CardTitle>
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as TimeframeOption)}>
            <TabsList className="h-8">
              <TabsTrigger value="1D" className="text-xs px-2">1D</TabsTrigger>
              <TabsTrigger value="5D" className="text-xs px-2">5D</TabsTrigger>
              <TabsTrigger value="1M" className="text-xs px-2">1M</TabsTrigger>
              <TabsTrigger value="3M" className="text-xs px-2">3M</TabsTrigger>
              <TabsTrigger value="6M" className="text-xs px-2">6M</TabsTrigger>
              <TabsTrigger value="1Y" className="text-xs px-2">1Y</TabsTrigger>
              <TabsTrigger value="2Y" className="text-xs px-2">2Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[500px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[500px] text-destructive">
            <p>Failed to load chart data</p>
          </div>
        ) : candleData.length === 0 ? (
          <div className="flex items-center justify-center h-[500px] text-muted-foreground">
            <p>No data available</p>
          </div>
        ) : (
          <div className="relative">
            <CandlestickChartRenderer candleData={candleData} minPrice={minPrice} maxPrice={maxPrice} previousClose={previousClose} timeframe={timeframe} />
            <div className="absolute top-2 left-2 flex items-center gap-3 text-xs bg-background/90 backdrop-blur-sm px-2 py-1 rounded border border-border/50">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#26a69a]" /><span className="text-muted-foreground">Bullish</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#ef5350]" /><span className="text-muted-foreground">Bearish</span></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(StockCandlestickChart);
