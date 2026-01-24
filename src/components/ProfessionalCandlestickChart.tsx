import { useRef, useEffect, memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createChart, ColorType } from "lightweight-charts";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ProfessionalCandlestickChartProps {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  high: number;
  low: number;
  open: number;
}

type TimeframeOption = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '2Y';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

const toBusinessDayString = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toISOString().slice(0, 10);

const isValidTimeRange = (r: any): r is { from: any; to: any } =>
  !!r && r.from != null && r.to != null;

// Custom hook to fetch candlestick data for a specific timeframe
const useCandlestickDataForTimeframe = (symbol: string, timeframe: TimeframeOption) => {
  return useQuery({
    queryKey: ['candlestick', symbol, timeframe],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('polygon-candles', {
        body: { ticker: symbol, timeframe }
      });
      
      if (error) throw error;
      return data as { candles: CandleData[]; resolution: string; totalBars: number };
    },
    staleTime: 30000,
    refetchInterval: 60000,
    enabled: !!symbol,
  });
};

const ProfessionalCandlestickChart = ({ symbol, previousClose }: ProfessionalCandlestickChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const volumeRef = useRef<any>(null);
  const syncingRef = useRef(false);

  const [activeTimeframe, setActiveTimeframe] = useState<TimeframeOption>('1M');
  
  const { data: chartData, isLoading, error } = useCandlestickDataForTimeframe(symbol, activeTimeframe);
  const candleData = chartData?.candles || [];
  const resolution = chartData?.resolution || '';

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

    // Sort and format data
    const sorted = [...candleData].sort((a, b) => a.time - b.time);

    // Use Unix timestamps for any sub-daily resolution (minute/hour data)
    // Only use BusinessDay strings for daily/weekly data (6M, 1Y, 2Y)
    const usesSubDailyResolution = ['1D', '5D', '1M', '3M'].includes(activeTimeframe);
    
    const formattedData = sorted.map((c) => ({
      time: usesSubDailyResolution ? c.time : toBusinessDayString(c.time) as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = sorted.map((c) => ({
      time: usesSubDailyResolution ? c.time : toBusinessDayString(c.time) as any,
      value: c.volume || 0,
      color: c.close >= c.open ? '#26a69a' : '#ef5350',
    }));

    // Calculate appropriate bar spacing based on data density
    const barSpacing = Math.max(3, Math.min(12, 800 / candleData.length));

    let chart: any;
    let volumeChart: any;
    try {
      chart = createChart(chartEl, {
        layout: { 
          background: { type: ColorType.Solid, color: "#131722" },
          textColor: "#d1d4dc", 
          fontSize: 12, 
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
        },
        grid: { 
          vertLines: { color: "rgba(42, 46, 57, 0.5)", style: 1, visible: true }, 
          horzLines: { color: "rgba(42, 46, 57, 0.5)", style: 1, visible: true } 
        },
        width: chartWidth,
        height: 700,
        timeScale: { 
          borderColor: "rgba(42, 46, 57, 0.8)", 
          timeVisible: true, 
          secondsVisible: false, 
          rightOffset: 10,
          barSpacing: barSpacing,
          minBarSpacing: 1,
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
          barSpacing: barSpacing,
          minBarSpacing: 1,
        },
        rightPriceScale: { visible: false },
        leftPriceScale: { visible: false },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
        handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      });
    } catch { return; }

    // Sync charts safely
    chart.timeScale().subscribeVisibleTimeRangeChange((timeRange: any) => {
      if (syncingRef.current) return;
      if (!isValidTimeRange(timeRange)) return;
      syncingRef.current = true;
      try {
        volumeChart.timeScale().setVisibleRange(timeRange);
      } catch { } finally {
        syncingRef.current = false;
      }
    });
    volumeChart.timeScale().subscribeVisibleTimeRangeChange((timeRange: any) => {
      if (syncingRef.current) return;
      if (!isValidTimeRange(timeRange)) return;
      syncingRef.current = true;
      try {
        chart.timeScale().setVisibleRange(timeRange);
      } catch { } finally {
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
    } catch { }

    // Previous close line
    candlestickSeries.createPriceLine({ 
      price: previousClose, 
      color: 'rgba(255, 152, 0, 0.5)', 
      lineWidth: 1, 
      lineStyle: 2, 
      axisLabelVisible: true, 
      title: 'Prev' 
    });

    // Fit content to show all data for the timeframe
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
  }, [candleData, previousClose, activeTimeframe]);

  const timeframeButtons: { label: string; value: TimeframeOption }[] = [
    { label: '1D', value: '1D' },
    { label: '5D', value: '5D' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
    { label: '1Y', value: '1Y' },
    { label: '2Y', value: '2Y' },
  ];

  return (
    <Card className="w-full bg-[#131722] border-[#2a2e39]">
      <CardHeader className="pb-2 border-b border-[#2a2e39]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl flex items-center gap-2 text-[#d1d4dc]">
              <BarChart3 className="w-6 h-6 text-primary" />
              {symbol}
            </CardTitle>
            {resolution && (
              <span className="text-xs px-2 py-0.5 bg-[#2a2e39] text-[#787b86] rounded">
                {resolution}
              </span>
            )}
            {candleData.length > 0 && (
              <span className="text-xs text-[#787b86]">
                {candleData.length} bars
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {timeframeButtons.map((btn) => (
              <Button
                key={btn.value}
                variant="ghost"
                size="sm"
                onClick={() => setActiveTimeframe(btn.value)}
                className={`text-xs h-7 px-2.5 ${
                  activeTimeframe === btn.value
                    ? 'bg-primary/20 text-primary'
                    : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
                }`}
              >
                {btn.label}
              </Button>
            ))}
          </div>
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