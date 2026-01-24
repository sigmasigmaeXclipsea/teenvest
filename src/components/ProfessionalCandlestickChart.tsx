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

type TimePeriod = '1d' | '5d' | '1m' | 'ytd' | '1y' | '2y';

const isIntraday = (p: TimePeriod) => p === '1d' || p === '5d';

const toBusinessDayString = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toISOString().slice(0, 10);

const isValidTimeRange = (r: any): r is { from: any; to: any } =>
  !!r && r.from != null && r.to != null;

const ProfessionalCandlestickChart = ({ symbol, currentPrice, previousClose, high, low, open }: ProfessionalCandlestickChartProps) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('2y'); // Default to 2Y for TradingView-like experience
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const volumeRef = useRef<any>(null);

  const syncingRef = useRef(false);

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

    const intraday = isIntraday(timePeriod);
    // Always sort using the numeric unix timestamp first.
    const sorted = [...candleData].sort((a, b) => a.time - b.time);

    // lightweight-charts is picky: intraday can be unix seconds (UTCTimestamp),
    // but daily is best represented as a BusinessDay (YYYY-MM-DD).
    const formattedData = sorted.map((c) => ({
      time: (intraday ? c.time : toBusinessDayString(c.time)) as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = sorted.map((c) => ({
      time: (intraday ? c.time : toBusinessDayString(c.time)) as any,
      value: c.volume || 0,
      color: c.close >= c.open ? '#26a69a' : '#ef5350',
    }));

    // Calculate bar spacing based on data density for optimal viewing
    // Longer timeframes = more bars = smaller spacing to fit more on screen
    let barSpacing = 8;
    let minBarSpacing = 3;
    
    if (timePeriod === '2y') {
      barSpacing = 6; // Weekly bars - fit all 2 years nicely
      minBarSpacing = 2;
    } else if (timePeriod === '1y') {
      barSpacing = 4; // Daily bars for a full year
      minBarSpacing = 2;
    } else if (timePeriod === 'ytd') {
      barSpacing = 5;
      minBarSpacing = 2;
    }

    let chart: any;
    let volumeChart: any;
    try {
      chart = createChart(chartEl, {
        layout: { 
          background: { type: ColorType.Solid, color: "#131722" }, // TradingView dark
          textColor: "#d1d4dc", 
          fontSize: 12, 
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
        },
        grid: { 
          vertLines: { color: "rgba(42, 46, 57, 0.5)", style: 1, visible: true }, 
          horzLines: { color: "rgba(42, 46, 57, 0.5)", style: 1, visible: true } 
        },
        width: chartWidth,
        height: 700, // BIG chart like TradingView
        timeScale: { 
          borderColor: "rgba(42, 46, 57, 0.8)", 
          timeVisible: true, 
          secondsVisible: false, 
          rightOffset: 10,
          barSpacing,
          minBarSpacing,
          fixLeftEdge: false,
          fixRightEdge: false,
        },
        rightPriceScale: { 
          borderColor: "rgba(42, 46, 57, 0.8)", 
          scaleMargins: { top: 0.05, bottom: 0.05 },
          autoScale: true,
        },
        leftPriceScale: { visible: false },
        crosshair: { 
          mode: 1, 
          vertLine: { color: "rgba(224, 227, 235, 0.4)", width: 1, style: 0, labelBackgroundColor: "#2a2e39" }, 
          horzLine: { color: "rgba(224, 227, 235, 0.4)", width: 1, style: 0, labelBackgroundColor: "#2a2e39" } 
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
        handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      });

      volumeChart = createChart(volumeEl, {
        layout: { 
          background: { type: ColorType.Solid, color: "#131722" }, 
          textColor: "#787b86", 
          fontSize: 10 
        },
        grid: { vertLines: { visible: false }, horzLines: { color: "rgba(42, 46, 57, 0.3)", visible: true } },
        width: volumeWidth,
        height: 120,
        timeScale: { 
          borderColor: "rgba(42, 46, 57, 0.5)", 
          timeVisible: true, 
          visible: true,
          barSpacing,
          minBarSpacing,
        },
        rightPriceScale: { visible: false },
        leftPriceScale: { visible: false },
      });
    } catch { return; }

    // Sync charts safely.
    chart.timeScale().subscribeVisibleTimeRangeChange((timeRange: any) => {
      if (syncingRef.current) return;
      if (!isValidTimeRange(timeRange)) return;
      syncingRef.current = true;
      try {
        volumeChart.timeScale().setVisibleRange(timeRange);
      } catch {
        // ignore transient range issues
      } finally {
        syncingRef.current = false;
      }
    });
    volumeChart.timeScale().subscribeVisibleTimeRangeChange((timeRange: any) => {
      if (syncingRef.current) return;
      if (!isValidTimeRange(timeRange)) return;
      syncingRef.current = true;
      try {
        chart.timeScale().setVisibleRange(timeRange);
      } catch {
        // ignore transient range issues
      } finally {
        syncingRef.current = false;
      }
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#26a69a", 
      downColor: "#ef5350", 
      borderUpColor: "#26a69a", 
      borderDownColor: "#ef5350", 
      wickUpColor: "#26a69a", 
      wickDownColor: "#ef5350", 
      borderVisible: true,
    });
    try {
      candlestickSeries.setData(formattedData);
    } catch {
      try { chart.remove(); } catch { }
      try { volumeChart.remove(); } catch { }
      return;
    }

    const volumeSeries = volumeChart.addHistogramSeries({ 
      color: '#26a69a', 
      priceFormat: { type: 'volume' }, 
      priceScaleId: '' 
    });
    try {
      volumeSeries.setData(volumeData);
    } catch {
      // If volume fails, still keep the main chart alive
    }

    // Add previous close line
    candlestickSeries.createPriceLine({ 
      price: previousClose, 
      color: 'rgba(255, 152, 0, 0.5)', 
      lineWidth: 1, 
      lineStyle: 2, 
      axisLabelVisible: true, 
      title: 'Prev' 
    });

    // Fit content to show all data initially
    try { chart.timeScale().fitContent(); } catch { }
    try { volumeChart.timeScale().fitContent(); } catch { }

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
  }, [candleData, previousClose, timePeriod]);

  // Resolution labels for each timeframe
  const getResolutionLabel = () => {
    switch (timePeriod) {
      case '1d': return '5min';
      case '5d': return '15min';
      case '1m': return 'Daily';
      case 'ytd': return 'Daily';
      case '1y': return 'Daily';
      case '2y': return 'Weekly';
      default: return '';
    }
  };

  return (
    <Card className="w-full bg-[#131722] border-[#2a2e39]">
      <CardHeader className="pb-2 border-b border-[#2a2e39]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl flex items-center gap-2 text-[#d1d4dc]">
              <BarChart3 className="w-6 h-6 text-primary" />
              {symbol}
            </CardTitle>
            <span className="text-xs px-2 py-0.5 bg-[#2a2e39] text-[#787b86] rounded">
              {getResolutionLabel()}
            </span>
            {candleData.length > 0 && (
              <span className="text-xs text-[#787b86]">
                {candleData.length} bars
              </span>
            )}
          </div>
          <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <TabsList className="h-8 bg-[#2a2e39] border-0">
              <TabsTrigger value="1d" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">1D</TabsTrigger>
              <TabsTrigger value="5d" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">5D</TabsTrigger>
              <TabsTrigger value="1m" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">1M</TabsTrigger>
              <TabsTrigger value="ytd" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">YTD</TabsTrigger>
              <TabsTrigger value="1y" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">1Y</TabsTrigger>
              <TabsTrigger value="2y" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">2Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-[820px] bg-[#131722]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[820px] text-destructive bg-[#131722]">
            <p>Failed to load chart data</p>
          </div>
        ) : candleData.length === 0 ? (
          <div className="flex items-center justify-center h-[820px] text-[#787b86] bg-[#131722]">
            <p>No data available</p>
          </div>
        ) : (
          <div className="bg-[#131722]">
            <div className="relative">
              <div ref={chartContainerRef} className="w-full" style={{ height: '700px' }} />
              {/* Legend overlay */}
              <div className="absolute top-2 left-2 flex items-center gap-3 text-xs bg-[#131722]/90 backdrop-blur-sm px-3 py-1.5 rounded border border-[#2a2e39]">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#26a69a]" /><span className="text-[#787b86]">Bullish</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#ef5350]" /><span className="text-[#787b86]">Bearish</span></div>
              </div>
            </div>
            <div className="border-t border-[#2a2e39]">
              <div className="text-xs text-[#787b86] px-2 py-1 bg-[#1e222d]">Volume</div>
              <div ref={volumeContainerRef} className="w-full" style={{ height: '120px' }} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(ProfessionalCandlestickChart);
