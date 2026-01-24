import { useState, useRef, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createChart, ColorType } from "lightweight-charts";
import { useCandlestickData } from '@/hooks/useStockAPI';

interface ProfessionalCandlestickChartProps {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  high: number;
  low: number;
  open: number;
}

type TimePeriod = '1d' | '5d' | '1m' | 'ytd' | '1y';

const ProfessionalCandlestickChart = ({ symbol, currentPrice, previousClose, high, low, open }: ProfessionalCandlestickChartProps) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1m');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const volumeRef = useRef<any>(null);

  const { data: candleData = [], isLoading, error } = useCandlestickData(symbol, timePeriod);

  useEffect(() => {
    const chartEl = chartContainerRef.current;
    const volumeEl = volumeContainerRef.current;
    if (!chartEl || !volumeEl || !candleData || candleData.length === 0) return;

    const chartWidth = chartEl.clientWidth;
    const volumeWidth = volumeEl.clientWidth;
    if (!chartWidth || chartWidth <= 0 || !volumeWidth || volumeWidth <= 0) return;

    if (chartRef.current) {
      try { chartRef.current.remove(); } catch { }
      chartRef.current = null;
    }
    if (volumeRef.current) {
      try { volumeRef.current.remove(); } catch { }
      volumeRef.current = null;
    }

    const formattedData = candleData
      .map((c) => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close }))
      .sort((a, b) => (a.time as number) - (b.time as number));

    const volumeData = candleData
      .map((c) => ({
        time: c.time as any,
        value: c.volume || 0,
        color: c.close >= c.open ? '#26a69a' : '#ef5350',
      }))
      .sort((a, b) => (a.time as number) - (b.time as number));

    let chart: any;
    let volumeChart: any;
    try {
      chart = createChart(chartEl, {
        layout: { background: { type: ColorType.Solid, color: "hsl(var(--background))" }, textColor: "hsl(var(--foreground))", fontSize: 13, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
        grid: { vertLines: { color: "rgba(148, 163, 184, 0.15)", style: 1, visible: true }, horzLines: { color: "rgba(148, 163, 184, 0.15)", style: 1, visible: true } },
        width: chartWidth,
        height: 600,
        timeScale: { borderColor: "rgba(148, 163, 184, 0.3)", timeVisible: true, secondsVisible: false, rightOffset: 12, barSpacing: 8, minBarSpacing: 3 },
        rightPriceScale: { borderColor: "rgba(148, 163, 184, 0.3)", scaleMargins: { top: 0.1, bottom: 0.1 } },
        leftPriceScale: { visible: false },
        crosshair: { mode: 1, vertLine: { color: "rgba(148, 163, 184, 0.6)", width: 1, style: 2, labelBackgroundColor: "hsl(var(--background))" }, horzLine: { color: "rgba(148, 163, 184, 0.6)", width: 1, style: 2, labelBackgroundColor: "hsl(var(--background))" } },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
        handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      });

      volumeChart = createChart(volumeEl, {
        layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "hsl(var(--muted-foreground))", fontSize: 11 },
        grid: { vertLines: { visible: false }, horzLines: { visible: false } },
        width: volumeWidth,
        height: 150,
        timeScale: { borderColor: "rgba(148, 163, 184, 0.2)", timeVisible: true, visible: true },
        rightPriceScale: { visible: false },
        leftPriceScale: { visible: false },
      });
    } catch { return; }

    chart.timeScale().subscribeVisibleTimeRangeChange((timeRange: any) => {
      if (timeRange) volumeChart.timeScale().setVisibleRange(timeRange);
    });
    volumeChart.timeScale().subscribeVisibleTimeRangeChange((timeRange: any) => {
      if (timeRange) chart.timeScale().setVisibleRange(timeRange);
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#26a69a", downColor: "#ef5350", borderUpColor: "#26a69a", borderDownColor: "#ef5350", wickUpColor: "#26a69a", wickDownColor: "#ef5350", borderVisible: true,
    });
    candlestickSeries.setData(formattedData);

    const volumeSeries = volumeChart.addHistogramSeries({ color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '' });
    volumeSeries.setData(volumeData);

    candlestickSeries.createPriceLine({ price: previousClose, color: 'rgba(148, 163, 184, 0.5)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'Prev Close' });

    chart.timeScale().fitContent();
    volumeChart.timeScale().fitContent();

    const handleResize = () => {
      const cw = chartContainerRef.current?.clientWidth;
      const vw = volumeContainerRef.current?.clientWidth;
      if (cw && cw > 0) { try { chart.applyOptions({ width: cw }); } catch { } }
      if (vw && vw > 0) { try { volumeChart.applyOptions({ width: vw }); } catch { } }
    };
    window.addEventListener("resize", handleResize);
    chartRef.current = chart;
    volumeRef.current = volumeChart;

    return () => {
      window.removeEventListener("resize", handleResize);
      try { chart.remove(); } catch { }
      try { volumeChart.remove(); } catch { }
    };
  }, [candleData, previousClose]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            {symbol} – Professional Chart
          </CardTitle>
          <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <TabsList className="h-9">
              <TabsTrigger value="1d" className="text-xs px-3">1D</TabsTrigger>
              <TabsTrigger value="5d" className="text-xs px-3">5D</TabsTrigger>
              <TabsTrigger value="1m" className="text-xs px-3">1M</TabsTrigger>
              <TabsTrigger value="ytd" className="text-xs px-3">YTD</TabsTrigger>
              <TabsTrigger value="1y" className="text-xs px-3">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-[750px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[750px] text-destructive">
            <p>Failed to load chart data</p>
          </div>
        ) : candleData.length === 0 ? (
          <div className="flex items-center justify-center h-[750px] text-muted-foreground">
            <p>No data available</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <div ref={chartContainerRef} className="w-full h-[600px]" style={{ minHeight: '600px' }} />
              <div className="absolute top-3 left-3 flex items-center gap-4 text-xs bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded border border-border/50">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#26a69a]" /><span className="text-muted-foreground font-medium">Bullish</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#ef5350]" /><span className="text-muted-foreground font-medium">Bearish</span></div>
              </div>
            </div>
            <div className="border-t border-border/50 pt-2">
              <div className="text-xs text-muted-foreground mb-2 px-1">Volume</div>
              <div ref={volumeContainerRef} className="w-full h-[150px]" style={{ minHeight: '150px' }} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(ProfessionalCandlestickChart);
