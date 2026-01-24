import { useState, useRef, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createChart, ColorType } from "lightweight-charts";
import { supabase } from '@/integrations/supabase/client';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface ProfessionalCandlestickChartProps {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  high: number;
  low: number;
  open: number;
}

type TimePeriod = '1D' | '5D' | '1M' | 'YTD' | '1Y';

const ProfessionalCandlestickChart = ({ symbol, currentPrice, previousClose, high, low, open }: ProfessionalCandlestickChartProps) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1M');
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const volumeRef = useRef<any>(null);

  // Fetch candle data from Polygon API via edge function
  useEffect(() => {
    const fetchCandles = async () => {
      if (!symbol) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fnError } = await supabase.functions.invoke('polygon-candles', {
          body: { ticker: symbol, timeframe: timePeriod }
        });
        
        if (fnError) {
          throw new Error(fnError.message);
        }
        
        if (data?.error) {
          throw new Error(data.error);
        }
        
        if (data?.candles && Array.isArray(data.candles)) {
          setCandleData(data.candles);
        } else {
          setCandleData([]);
        }
      } catch (err) {
        console.error('Failed to fetch candle data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chart data');
        setCandleData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCandles();
  }, [symbol, timePeriod]);

  useEffect(() => {
    const chartEl = chartContainerRef.current;
    const volumeEl = volumeContainerRef.current;
    if (!chartEl || !volumeEl || !candleData || candleData.length === 0) return;

    // Guard against hidden tabs (width=0) which can cause lightweight-charts to throw.
    const chartWidth = chartEl.clientWidth;
    const volumeWidth = volumeEl.clientWidth;
    if (!chartWidth || chartWidth <= 0 || !volumeWidth || volumeWidth <= 0) return;

    // Clear any previous instances if effect re-runs.
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch {
        // ignore
      }
      chartRef.current = null;
    }
    if (volumeRef.current) {
      try {
        volumeRef.current.remove();
      } catch {
        // ignore
      }
      volumeRef.current = null;
    }

    // Format data for lightweight-charts - sort by time ascending
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

    const volumeData = candleData
      .map((candle) => {
        const isUp = candle.close >= candle.open;
        return {
          time: candle.time as any,
          value: candle.volume || 0,
          color: isUp ? '#26a69a' : '#ef5350',
        };
      })
      // CRITICAL: Sort by time ascending
      .sort((a, b) => (a.time as number) - (b.time as number));

    // Create main candlestick chart
    let chart: any;
    let volumeChart: any;
    try {
      chart = createChart(chartEl, {
        layout: {
          background: { type: ColorType.Solid, color: "hsl(var(--background))" },
          textColor: "hsl(var(--foreground))",
          fontSize: 13,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        grid: {
          vertLines: {
            color: "rgba(148, 163, 184, 0.15)",
            style: 1,
            visible: true,
          },
          horzLines: {
            color: "rgba(148, 163, 184, 0.15)",
            style: 1,
            visible: true,
          },
        },
        width: chartWidth,
        height: 600,
        timeScale: {
          borderColor: "rgba(148, 163, 184, 0.3)",
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 12,
          barSpacing: 8,
          minBarSpacing: 3,
        },
        rightPriceScale: {
          borderColor: "rgba(148, 163, 184, 0.3)",
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        leftPriceScale: {
          visible: false,
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: "rgba(148, 163, 184, 0.6)",
            width: 1,
            style: 2,
            labelBackgroundColor: "hsl(var(--background))",
          },
          horzLine: {
            color: "rgba(148, 163, 184, 0.6)",
            width: 1,
            style: 2,
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

      volumeChart = createChart(volumeEl, {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "hsl(var(--muted-foreground))",
          fontSize: 11,
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { visible: false },
        },
        width: volumeWidth,
        height: 150,
        timeScale: {
          borderColor: "rgba(148, 163, 184, 0.2)",
          timeVisible: true,
          visible: true,
        },
        rightPriceScale: {
          visible: false,
        },
        leftPriceScale: {
          visible: false,
        },
      });
    } catch {
      return;
    }

    // Sync time scales
    chart.timeScale().subscribeVisibleTimeRangeChange((timeRange: any) => {
      if (timeRange) {
        volumeChart.timeScale().setVisibleRange(timeRange);
      }
    });

    volumeChart.timeScale().subscribeVisibleTimeRangeChange((timeRange: any) => {
      if (timeRange) {
        chart.timeScale().setVisibleRange(timeRange);
      }
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
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
      // Clean up and return early
      try { chart.remove(); } catch {}
      try { volumeChart.remove(); } catch {}
      return;
    }

    // Add volume series
    const volumeSeries = volumeChart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    try {
      volumeSeries.setData(volumeData);
    } catch (e) {
      console.error('Failed to set volume data:', e);
    }

    // Add previous close line
    if (previousClose && previousClose > 0) {
      candlestickSeries.createPriceLine({
        price: previousClose,
        color: 'rgba(148, 163, 184, 0.5)',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Prev Close',
      });
    }

    chart.timeScale().fitContent();
    volumeChart.timeScale().fitContent();

    const handleResize = () => {
      const cw = chartContainerRef.current?.clientWidth;
      const vw = volumeContainerRef.current?.clientWidth;
      if (cw && cw > 0) {
        try {
          chart.applyOptions({ width: cw });
        } catch {
          // ignore
        }
      }
      if (vw && vw > 0) {
        try {
          volumeChart.applyOptions({ width: vw });
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("resize", handleResize);
    chartRef.current = chart;
    volumeRef.current = volumeChart;

    return () => {
      window.removeEventListener("resize", handleResize);
      try {
        chart.remove();
      } catch {
        // ignore
      }
      try {
        volumeChart.remove();
      } catch {
        // ignore
      }
    };
  }, [candleData, previousClose]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            {symbol} - Professional Chart
          </CardTitle>
          <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <TabsList className="h-9">
              <TabsTrigger value="1D" className="text-xs px-3">1D</TabsTrigger>
              <TabsTrigger value="5D" className="text-xs px-3">5D</TabsTrigger>
              <TabsTrigger value="1M" className="text-xs px-3">1M</TabsTrigger>
              <TabsTrigger value="YTD" className="text-xs px-3">YTD</TabsTrigger>
              <TabsTrigger value="1Y" className="text-xs px-3">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-0">
        {loading ? (
          <div className="flex items-center justify-center h-[600px]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading chart data...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
            <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-1">Try selecting a different timeframe</p>
          </div>
        ) : candleData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
            <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No chart data available</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <div ref={chartContainerRef} className="w-full h-[600px]" style={{ minHeight: '600px' }} />
              <div className="absolute top-3 left-3 flex items-center gap-4 text-xs bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded border border-border/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#26a69a]"></div>
                  <span className="text-muted-foreground font-medium">Bullish</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#ef5350]"></div>
                  <span className="text-muted-foreground font-medium">Bearish</span>
                </div>
                <div className="text-muted-foreground/70">
                  {candleData.length} bars
                </div>
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
