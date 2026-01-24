import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { createChart, ColorType, IChartApi, ISeriesApi } from "lightweight-charts";
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

// Client-side cache for instant loading
const chartCache = new Map<string, { data: CandleData[]; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

const ProfessionalCandlestickChart = ({ symbol, currentPrice, previousClose }: ProfessionalCandlestickChartProps) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1D');
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // Fetch candle data with caching
  const fetchCandles = useCallback(async (ticker: string, tf: TimePeriod) => {
    const cacheKey = `${ticker}-${tf}`;
    const cached = chartCache.get(cacheKey);
    
    // Return cached data if fresh
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    
    const { data, error: fnError } = await supabase.functions.invoke('polygon-candles', {
      body: { ticker, timeframe: tf }
    });
    
    if (fnError) throw new Error(fnError.message);
    if (data?.error) throw new Error(data.error);
    
    const candles = data?.candles || [];
    
    // Cache the result
    chartCache.set(cacheKey, { data: candles, timestamp: Date.now() });
    
    return candles;
  }, []);

  useEffect(() => {
    if (!symbol) return;
    
    let cancelled = false;
    
    const loadData = async () => {
      // Check cache first for instant display
      const cacheKey = `${symbol}-${timePeriod}`;
      const cached = chartCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setCandleData(cached.data);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const candles = await fetchCandles(symbol, timePeriod);
        if (!cancelled) {
          setCandleData(candles);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch candle data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load chart');
          setCandleData([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => { cancelled = true; };
  }, [symbol, timePeriod, fetchCandles]);

  // Initialize chart once
  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;

    const width = el.clientWidth;
    if (!width || width <= 0) return;

    // Create chart with TradingView styling
    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "#131722" },
        textColor: "#d1d4dc",
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif',
      },
      grid: {
        vertLines: { color: "#1e222d", visible: true },
        horzLines: { color: "#1e222d", visible: true },
      },
      width,
      height: 500,
      timeScale: {
        borderColor: "#2a2e39",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 6,
        minBarSpacing: 2,
      },
      rightPriceScale: {
        borderColor: "#2a2e39",
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "#758696",
          width: 1,
          style: 2,
          labelBackgroundColor: "#2a2e39",
        },
        horzLine: {
          color: "#758696",
          width: 1,
          style: 2,
          labelBackgroundColor: "#2a2e39",
        },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    // Add volume series at bottom
    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      const w = el.clientWidth;
      if (w && w > 0) {
        chart.applyOptions({ width: w });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  // Update chart data when candleData changes
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candleData.length === 0) return;

    const formattedData = candleData
      .map((c) => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close }))
      .sort((a, b) => (a.time as number) - (b.time as number));

    const volumeData = candleData
      .map((c) => ({
        time: c.time as any,
        value: c.volume || 0,
        color: c.close >= c.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
      }))
      .sort((a, b) => (a.time as number) - (b.time as number));

    try {
      candleSeriesRef.current.setData(formattedData);
      volumeSeriesRef.current.setData(volumeData);
      
      // Add previous close line
      if (previousClose && previousClose > 0) {
        candleSeriesRef.current.createPriceLine({
          price: previousClose,
          color: '#787b86',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: '',
        });
      }
      
      chartRef.current?.timeScale().fitContent();
    } catch (e) {
      console.error('Chart data error:', e);
    }
  }, [candleData, previousClose]);

  const timeframes: { key: TimePeriod; label: string }[] = [
    { key: '1D', label: '1D' },
    { key: '5D', label: '5D' },
    { key: '1M', label: '1M' },
    { key: 'YTD', label: 'YTD' },
    { key: '1Y', label: '1Y' },
  ];

  return (
    <Card className="w-full overflow-hidden border-0 bg-[#131722]">
      {/* TradingView-style header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2e39]">
        <div className="flex items-center gap-4">
          <span className="text-white font-semibold text-lg">{symbol}</span>
          {candleData.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[#787b86]">O</span>
              <span className="text-white">{candleData[candleData.length - 1]?.open?.toFixed(2)}</span>
              <span className="text-[#787b86]">H</span>
              <span className="text-white">{candleData[candleData.length - 1]?.high?.toFixed(2)}</span>
              <span className="text-[#787b86]">L</span>
              <span className="text-white">{candleData[candleData.length - 1]?.low?.toFixed(2)}</span>
              <span className="text-[#787b86]">C</span>
              <span className={candleData[candleData.length - 1]?.close >= candleData[candleData.length - 1]?.open ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
                {candleData[candleData.length - 1]?.close?.toFixed(2)}
              </span>
            </div>
          )}
        </div>
        
        {/* Timeframe selector */}
        <div className="flex items-center gap-1">
          {timeframes.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimePeriod(key)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                timePeriod === key
                  ? 'bg-[#2962ff] text-white'
                  : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <CardContent className="p-0 relative">
        {/* Loading overlay - doesn't hide chart */}
        {loading && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-[#131722]/90 px-3 py-1.5 rounded text-xs text-[#787b86]">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading...
          </div>
        )}
        
        {error && candleData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#131722] text-[#787b86] text-sm">
            {error}
          </div>
        )}
        
        <div 
          ref={chartContainerRef} 
          className="w-full" 
          style={{ height: 500 }}
        />
      </CardContent>
    </Card>
  );
};

export default memo(ProfessionalCandlestickChart);
