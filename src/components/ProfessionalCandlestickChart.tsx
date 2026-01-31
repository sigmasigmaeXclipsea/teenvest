import { useRef, useEffect, memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2, Maximize2, Minimize2, PenLine, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAlphaIndicators } from '@/hooks/useAlphaIndicators';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSkillTreeProgress } from '@/hooks/useSkillTreeProgress';
import LockedFeatureCard from '@/components/LockedFeatureCard';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [emaPeriod, setEmaPeriod] = useState(20);
  const drawnLinesRef = useRef<number[]>([]);
  const drawnTrendLinesRef = useRef<Array<{ start: { time: any; value: number }; end: { time: any; value: number } }>>([]);
  const pendingLinePointRef = useRef<{ time: any; value: number } | null>(null);
  const [lineTool, setLineTool] = useState<'none' | 'trend' | 'resistance'>('none');
  const previewSeriesRef = useRef<any>(null);
  const startLineRef = useRef<any>(null);
  const lastCursorRef = useRef<{ time: any; value: number } | null>(null);
  const trendSeriesRef = useRef<any[]>([]);
  const resistanceLinesRef = useRef<any[]>([]);
  const candlestickSeriesRef = useRef<any>(null);
  const lineToolRef = useRef<'none' | 'trend' | 'resistance'>('none');
  const previewActiveRef = useRef(false);
  const previewRafRef = useRef<number | null>(null);
  const pendingPreviewRef = useRef<{ start: { time: any; value: number }; end: { time: any; value: number } } | null>(null);
  const syncRafRef = useRef<number | null>(null);
  const pendingRangeRef = useRef<{ from: any; to: any } | null>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const rsiChartRef = useRef<any>(null);
  const macdChartRef = useRef<any>(null);
  const emaSeriesRef = useRef<any>(null);
  const rsiSeriesRef = useRef<any>(null);
  const macdSeriesRef = useRef<any>(null);
  const macdSignalSeriesRef = useRef<any>(null);
  const macdHistSeriesRef = useRef<any>(null);
  
  const { data: chartData, isLoading, error } = useCandlestickDataForTimeframe(symbol, activeTimeframe);
  const candleData = chartData?.candles || [];
  const resolution = chartData?.resolution || '';
  const { data: indicatorData } = useAlphaIndicators(symbol, activeTimeframe, { emaPeriod });
  const { unlocks } = useSkillTreeProgress();
  const technicianUnlocked = unlocks.technician;

  const clearPreview = () => {
    previewActiveRef.current = false;
    pendingPreviewRef.current = null;
    if (previewRafRef.current != null) {
      cancelAnimationFrame(previewRafRef.current);
      previewRafRef.current = null;
    }
    try { previewSeriesRef.current?.setData([]); } catch {}
  };

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
    if (rsiChartRef.current) {
      try { rsiChartRef.current.remove(); } catch { }
      rsiChartRef.current = null;
    }
    if (macdChartRef.current) {
      try { macdChartRef.current.remove(); } catch { }
      macdChartRef.current = null;
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
    const chartHeight = isFullscreen ? Math.max(360, window.innerHeight - 260) : 700;
    const volumeHeight = isFullscreen ? 180 : 120;
    const rsiHeight = isFullscreen ? 140 : 110;
    const macdHeight = isFullscreen ? 160 : 120;

    let chart: any;
    let volumeChart: any;
    let rsiChart: any;
    let macdChart: any;
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
        height: chartHeight,
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
          mode: CrosshairMode.Normal, 
          vertLine: { color: "rgba(224, 227, 235, 0.4)", width: 1, style: 0, labelBackgroundColor: "#2a2e39" }, 
          horzLine: { color: "rgba(224, 227, 235, 0.4)", width: 1, style: 0, labelBackgroundColor: "#2a2e39" } 
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
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
        height: volumeHeight,
        timeScale: { 
          borderColor: "rgba(42, 46, 57, 0.5)", 
          timeVisible: true, 
          visible: true,
          barSpacing: barSpacing,
          minBarSpacing: 1,
        },
        rightPriceScale: { visible: false },
        leftPriceScale: { visible: false },
        handleScroll: { mouseWheel: false, pressedMouseMove: false, horzTouchDrag: false, vertTouchDrag: false },
        handleScale: { axisPressedMouseMove: false, mouseWheel: false, pinch: false },
      });

      const rsiEl = rsiContainerRef.current;
      const macdEl = macdContainerRef.current;
      const rsiWidth = rsiEl?.clientWidth || 0;
      const macdWidth = macdEl?.clientWidth || 0;
      if (rsiEl && macdEl && rsiWidth > 0 && macdWidth > 0) {
        rsiChart = createChart(rsiEl, {
          layout: {
            background: { type: ColorType.Solid, color: "#131722" },
            textColor: "#787b86",
            fontSize: 10,
          },
          grid: { vertLines: { visible: false }, horzLines: { color: "rgba(42, 46, 57, 0.3)", visible: true } },
          width: rsiWidth,
          height: rsiHeight,
          timeScale: {
            borderColor: "rgba(42, 46, 57, 0.5)",
            timeVisible: false,
            visible: false,
            barSpacing,
            minBarSpacing: 1,
          },
          rightPriceScale: {
            borderColor: "rgba(42, 46, 57, 0.5)",
            scaleMargins: { top: 0.2, bottom: 0.2 },
          },
          leftPriceScale: { visible: false },
          crosshair: { mode: CrosshairMode.Normal, vertLine: { visible: false }, horzLine: { visible: false } },
          handleScroll: { mouseWheel: false, pressedMouseMove: false, horzTouchDrag: false, vertTouchDrag: false },
          handleScale: { axisPressedMouseMove: false, mouseWheel: false, pinch: false },
        });

        macdChart = createChart(macdEl, {
          layout: {
            background: { type: ColorType.Solid, color: "#131722" },
            textColor: "#787b86",
            fontSize: 10,
          },
          grid: { vertLines: { visible: false }, horzLines: { color: "rgba(42, 46, 57, 0.3)", visible: true } },
          width: macdWidth,
          height: macdHeight,
          timeScale: {
            borderColor: "rgba(42, 46, 57, 0.5)",
            timeVisible: false,
            visible: false,
            barSpacing,
            minBarSpacing: 1,
          },
          rightPriceScale: {
            borderColor: "rgba(42, 46, 57, 0.5)",
            scaleMargins: { top: 0.2, bottom: 0.2 },
          },
          leftPriceScale: { visible: false },
          crosshair: { mode: CrosshairMode.Normal, vertLine: { visible: false }, horzLine: { visible: false } },
          handleScroll: { mouseWheel: false, pressedMouseMove: false, horzTouchDrag: false, vertTouchDrag: false },
          handleScale: { axisPressedMouseMove: false, mouseWheel: false, pinch: false },
        });
      }
    } catch { return; }

    // Sync subcharts to the main chart (throttled)
    const scheduleSubchartSync = (timeRange: any) => {
      if (syncingRef.current) return;
      if (!isValidTimeRange(timeRange)) return;
      pendingRangeRef.current = timeRange;
      if (syncRafRef.current != null) return;
      syncRafRef.current = requestAnimationFrame(() => {
        syncRafRef.current = null;
        const nextRange = pendingRangeRef.current;
        if (!nextRange) return;
        syncingRef.current = true;
        try {
          volumeChart.timeScale().setVisibleRange(nextRange);
          rsiChart?.timeScale().setVisibleRange(nextRange);
          macdChart?.timeScale().setVisibleRange(nextRange);
        } catch { } finally {
          syncingRef.current = false;
        }
      });
    };
    chart.timeScale().subscribeVisibleTimeRangeChange(scheduleSubchartSync);

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

    candlestickSeriesRef.current = candlestickSeries;
    emaSeriesRef.current = chart.addLineSeries({
      color: 'rgba(147, 197, 253, 0.9)',
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    trendSeriesRef.current = [];
    resistanceLinesRef.current = [];
    startLineRef.current = null;
    previewSeriesRef.current = chart.addLineSeries({
      color: 'rgba(34, 197, 94, 0.95)',
      lineWidth: 2,
      lineStyle: 2,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    if (rsiChart) {
      rsiSeriesRef.current = rsiChart.addLineSeries({
        color: 'rgba(251, 191, 36, 0.9)',
        lineWidth: 2,
        lastValueVisible: false,
        priceLineVisible: false,
      });
    } else {
      rsiSeriesRef.current = null;
    }

    if (macdChart) {
      macdSeriesRef.current = macdChart.addLineSeries({
        color: 'rgba(59, 130, 246, 0.9)',
        lineWidth: 2,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      macdSignalSeriesRef.current = macdChart.addLineSeries({
        color: 'rgba(244, 114, 182, 0.9)',
        lineWidth: 2,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      macdHistSeriesRef.current = macdChart.addHistogramSeries({
        base: 0,
        priceFormat: { type: 'price' },
      });
    } else {
      macdSeriesRef.current = null;
      macdSignalSeriesRef.current = null;
      macdHistSeriesRef.current = null;
    }

    const normalizeTime = (raw: any) => {
      if (raw == null) return null;
      if (usesSubDailyResolution) {
        if (typeof raw === 'number') return raw;
        if (typeof raw === 'string') {
          const parsed = Date.parse(raw);
          return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000);
        }
        if (typeof raw === 'object' && 'year' in raw) {
          const date = new Date(Date.UTC(raw.year, raw.month - 1, raw.day));
          return Math.floor(date.getTime() / 1000);
        }
        return null;
      }
      if (typeof raw === 'string') return raw;
      if (typeof raw === 'number') return toBusinessDayString(raw);
      if (typeof raw === 'object' && 'year' in raw) {
        return `${raw.year}-${String(raw.month).padStart(2, '0')}-${String(raw.day).padStart(2, '0')}`;
      }
      return null;
    };

    const applyDrawnLines = () => {
      drawnLinesRef.current.forEach((price) => {
        const priceLine = candlestickSeries.createPriceLine({
          price,
          color: 'rgba(56, 189, 248, 0.7)',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'Line',
        });
        resistanceLinesRef.current.push(priceLine);
      });
    };

    applyDrawnLines();

    const applyTrendLines = () => {
      drawnTrendLinesRef.current.forEach((line) => {
        const series = chart.addLineSeries({
          color: 'rgba(14, 165, 233, 0.9)',
          lineWidth: 2,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        series.setData([line.start, line.end]);
        trendSeriesRef.current.push(series);
      });
    };

    applyTrendLines();

    chart.subscribeCrosshairMove((param: any) => {
      if (lineToolRef.current !== 'trend' || !pendingLinePointRef.current) {
        if (previewActiveRef.current) {
          clearPreview();
        }
        lastCursorRef.current = null;
        return;
      }
      if (!param?.point) return;
      const rawTime = param.time ?? chart.timeScale().coordinateToTime(param.point.x);
      const time = normalizeTime(rawTime);
      const value = candlestickSeries.coordinateToPrice(param.point.y);
      if (time && value != null) {
        lastCursorRef.current = { time, value };
      }
      const cursor = lastCursorRef.current;
      if (!cursor) return;
      pendingPreviewRef.current = { start: pendingLinePointRef.current, end: cursor };
      previewActiveRef.current = true;
      if (previewRafRef.current == null) {
        previewRafRef.current = requestAnimationFrame(() => {
          previewRafRef.current = null;
          const pending = pendingPreviewRef.current;
          if (!pending) return;
          previewSeriesRef.current?.setData([pending.start, pending.end]);
        });
      }
    });

    chart.subscribeClick((param: any) => {
      const currentLineTool = lineToolRef.current;
      if (!param?.point) return;
      const value = candlestickSeries.coordinateToPrice(param.point.y);
      if (value == null) return;

      if (currentLineTool === 'trend') {
        const rawTime = param.time ?? chart.timeScale().coordinateToTime(param.point.x);
        const time = normalizeTime(rawTime);
        if (!time) return;

        if (!pendingLinePointRef.current) {
          pendingLinePointRef.current = { time, value };
          pendingPreviewRef.current = { start: pendingLinePointRef.current, end: { time, value } };
          previewActiveRef.current = true;
          previewSeriesRef.current?.setData([pendingLinePointRef.current, { time, value }]);
          if (startLineRef.current) {
            try {
              candlestickSeries.removePriceLine(startLineRef.current);
            } catch {}
            startLineRef.current = null;
          }
          startLineRef.current = candlestickSeries.createPriceLine({
            price: value,
            color: 'rgba(14, 165, 233, 0.95)',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: false,
            title: '',
          });
          return;
        }

        const start = pendingLinePointRef.current;
        const end = { time, value };
        pendingLinePointRef.current = null;
        lastCursorRef.current = null;
        lineToolRef.current = 'none';
        drawnTrendLinesRef.current.push({ start, end });
        clearPreview();
        if (startLineRef.current) {
          try {
            candlestickSeries.removePriceLine(startLineRef.current);
          } catch {}
          startLineRef.current = null;
        }

        const series = chart.addLineSeries({
          color: 'rgba(14, 165, 233, 0.9)',
          lineWidth: 2,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        series.setData([start, end]);
        trendSeriesRef.current.push(series);
        
        // Update React state to sync UI button
        setLineTool('none');
        return;
      }

      if (currentLineTool === 'resistance') {
        drawnLinesRef.current.push(value);
        const priceLine = candlestickSeries.createPriceLine({
          price: value,
          color: 'rgba(56, 189, 248, 0.7)',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'Line',
        });
        resistanceLinesRef.current.push(priceLine);
      }
    });

    // Fit content to show all data for the timeframe
    try { chart.timeScale().fitContent(); } catch { }
    try { volumeChart.timeScale().fitContent(); } catch { }

    const handleResize = () => {
      const nextChartHeight = isFullscreen ? Math.max(360, window.innerHeight - 260) : 700;
      const nextVolumeHeight = isFullscreen ? 180 : 120;
      const nextRsiHeight = isFullscreen ? 140 : 110;
      const nextMacdHeight = isFullscreen ? 160 : 120;
      const cw = chartContainerRef.current?.clientWidth;
      const vw = volumeContainerRef.current?.clientWidth;
      const rw = rsiContainerRef.current?.clientWidth;
      const mw = macdContainerRef.current?.clientWidth;
      if (cw && cw > 0) { try { chart.applyOptions({ width: cw, height: nextChartHeight }); } catch { } }
      if (vw && vw > 0) { try { volumeChart.applyOptions({ width: vw, height: nextVolumeHeight }); } catch { } }
      if (rw && rw > 0) { try { rsiChart?.applyOptions({ width: rw, height: nextRsiHeight }); } catch { } }
      if (mw && mw > 0) { try { macdChart?.applyOptions({ width: mw, height: nextMacdHeight }); } catch { } }
    };
    window.addEventListener("resize", handleResize);
    chartRef.current = chart;
    volumeRef.current = volumeChart;
    rsiChartRef.current = rsiChart || null;
    macdChartRef.current = macdChart || null;

    return () => {
      window.removeEventListener("resize", handleResize);
      if (syncRafRef.current != null) {
        cancelAnimationFrame(syncRafRef.current);
        syncRafRef.current = null;
      }
      if (previewRafRef.current != null) {
        cancelAnimationFrame(previewRafRef.current);
        previewRafRef.current = null;
      }
      pendingRangeRef.current = null;
      clearPreview();
      try { chart.remove(); } catch { }
      try { volumeChart.remove(); } catch { }
      try { rsiChart?.remove(); } catch { }
      try { macdChart?.remove(); } catch { }
    };
  }, [candleData, previousClose, activeTimeframe, isFullscreen]);

  useEffect(() => {
    const usesSubDailyResolution = ['1D', '5D', '1M', '3M'].includes(activeTimeframe);
    const toChartTime = (t: number) => (usesSubDailyResolution ? t : toBusinessDayString(t));

    if (!indicatorData) {
      try { emaSeriesRef.current?.setData([]); } catch {}
      try { rsiSeriesRef.current?.setData([]); } catch {}
      try { macdSeriesRef.current?.setData([]); } catch {}
      try { macdSignalSeriesRef.current?.setData([]); } catch {}
      try { macdHistSeriesRef.current?.setData([]); } catch {}
      return;
    }

    const emaValues = indicatorData.ema?.values || [];
    const rsiValues = indicatorData.rsi?.values || [];
    const macdValues = indicatorData.macd?.values || [];

    if (emaSeriesRef.current) {
      const emaSeries = emaValues.map((p) => ({ time: toChartTime(p.time), value: p.value }));
      try { emaSeriesRef.current.setData(emaSeries); } catch {}
    }

    if (!technicianUnlocked) {
      try { rsiSeriesRef.current?.setData([]); } catch {}
      try { macdSeriesRef.current?.setData([]); } catch {}
      try { macdSignalSeriesRef.current?.setData([]); } catch {}
      try { macdHistSeriesRef.current?.setData([]); } catch {}
      return;
    }

    if (rsiSeriesRef.current) {
      const rsiSeries = rsiValues.map((p) => ({ time: toChartTime(p.time), value: p.value }));
      try { rsiSeriesRef.current.setData(rsiSeries); } catch {}
    }

    if (macdSeriesRef.current && macdSignalSeriesRef.current && macdHistSeriesRef.current) {
      const macdSeries = macdValues.map((p) => ({ time: toChartTime(p.time), value: p.value }));
      const signalSeries = macdValues.map((p) => ({ time: toChartTime(p.time), value: p.signal }));
      const histSeries = macdValues.map((p) => ({
        time: toChartTime(p.time),
        value: p.hist,
        color: p.hist >= 0 ? '#26a69a' : '#ef5350',
      }));
      try { macdSeriesRef.current.setData(macdSeries); } catch {}
      try { macdSignalSeriesRef.current.setData(signalSeries); } catch {}
      try { macdHistSeriesRef.current.setData(histSeries); } catch {}
    }
  }, [indicatorData, activeTimeframe, technicianUnlocked]);

  useEffect(() => {
    if (!isFullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isFullscreen]);

  const timeframeButtons: { label: string; value: TimeframeOption }[] = [
    { label: '1D', value: '1D' },
    { label: '5D', value: '5D' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
    { label: '1Y', value: '1Y' },
    { label: '2Y', value: '2Y' },
  ];
  const emaPeriods = [10, 20, 50, 100, 200];

  const chartHeight = isFullscreen ? Math.max(360, window.innerHeight - 260) : 700;
  const volumeHeight = isFullscreen ? 180 : 120;
  const rsiHeight = isFullscreen ? 140 : 110;
  const macdHeight = isFullscreen ? 160 : 120;

  const toggleLineTool = (tool: 'trend' | 'resistance') => {
    setLineTool((prev) => {
      const next = prev === tool ? 'none' : tool;
      lineToolRef.current = next;
      if (next !== 'trend') {
        pendingLinePointRef.current = null;
        clearPreview();
        lastCursorRef.current = null;
        if (startLineRef.current) {
          try {
            candlestickSeriesRef.current?.removePriceLine(startLineRef.current);
          } catch {}
          startLineRef.current = null;
        }
      }
      return next;
    });
  };

  const clearLines = () => {
    trendSeriesRef.current.forEach((series) => {
      try {
        chartRef.current?.removeSeries(series);
      } catch {}
    });
    resistanceLinesRef.current.forEach((line) => {
      try {
        candlestickSeriesRef.current?.removePriceLine(line);
      } catch {}
    });
    trendSeriesRef.current = [];
    resistanceLinesRef.current = [];
    drawnTrendLinesRef.current = [];
    drawnLinesRef.current = [];
    pendingLinePointRef.current = null;
    clearPreview();
    lastCursorRef.current = null;
    if (startLineRef.current) {
      try {
        candlestickSeriesRef.current?.removePriceLine(startLineRef.current);
      } catch {}
      startLineRef.current = null;
    }
  };

  return (
    <Card className={`w-full bg-[#131722] border-[#2a2e39] ${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}>
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
            <div className="ml-2 flex items-center gap-2">
              <span className="text-[10px] text-[#787b86]">EMA</span>
              <Select value={emaPeriod.toString()} onValueChange={(v) => setEmaPeriod(Number(v))}>
                <SelectTrigger className="h-7 w-[90px] px-2 text-xs bg-[#2a2e39] border-[#2a2e39] text-[#d1d4dc]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {emaPeriods.map((period) => (
                    <SelectItem key={period} value={period.toString()}>
                      EMA {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLineTool('trend')}
              className={`ml-2 text-xs h-7 px-2.5 ${
                lineTool === 'trend'
                  ? 'bg-sky-500/20 text-sky-300'
                  : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
              }`}
            >
              <PenLine className="h-3.5 w-3.5 mr-1" />
              Trend Line
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLineTool('resistance')}
              className={`text-xs h-7 px-2.5 ${
                lineTool === 'resistance'
                  ? 'bg-sky-500/20 text-sky-300'
                  : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
              }`}
            >
              <Minus className="h-3.5 w-3.5 mr-1" />
              Resistance
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLines}
              className="text-xs h-7 px-2.5 text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
            >
              Clear
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="ml-2 h-7 w-7 text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center bg-[#131722]" style={{ height: chartHeight + volumeHeight + rsiHeight + macdHeight }}>
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center text-destructive bg-[#131722]" style={{ height: chartHeight + volumeHeight + rsiHeight + macdHeight }}>
            <p>Failed to load chart data</p>
          </div>
        ) : candleData.length === 0 ? (
          <div className="flex items-center justify-center text-[#787b86] bg-[#131722]" style={{ height: chartHeight + volumeHeight + rsiHeight + macdHeight }}>
            <p>No data available</p>
          </div>
        ) : (
          <div className="bg-[#131722]">
            <div className="relative">
              <div ref={chartContainerRef} className="w-full" style={{ height: `${chartHeight}px` }} />
              <div className="absolute top-2 left-2 flex items-center gap-3 text-xs bg-[#131722]/90 backdrop-blur-sm px-3 py-1.5 rounded border border-[#2a2e39]">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#26a69a]" /><span className="text-[#787b86]">Bullish</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#ef5350]" /><span className="text-[#787b86]">Bearish</span></div>
              </div>
              <div className="absolute top-2 right-2 text-[10px] text-[#787b86] bg-[#131722]/90 backdrop-blur-sm px-2 py-1 rounded border border-[#2a2e39]">
                {lineTool === 'trend'
                  ? 'Click to set start, then move cursor to place line'
                  : lineTool === 'resistance'
                    ? 'Click to add a resistance line'
                    : 'Select a line tool to draw'}
              </div>
            </div>
            <div className="border-t border-[#2a2e39]">
              <div className="text-xs text-[#787b86] px-2 py-1 bg-[#1e222d]">Volume</div>
              <div ref={volumeContainerRef} className="w-full" style={{ height: `${volumeHeight}px` }} />
            </div>
            {technicianUnlocked ? (
              <>
                <div className="border-t border-[#2a2e39]">
                  <div className="text-xs text-[#787b86] px-2 py-1 bg-[#1e222d]">RSI (14)</div>
                  <div ref={rsiContainerRef} className="w-full" style={{ height: `${rsiHeight}px` }} />
                </div>
                <div className="border-t border-[#2a2e39]">
                  <div className="text-xs text-[#787b86] px-2 py-1 bg-[#1e222d]">MACD (12, 26, 9)</div>
                  <div ref={macdContainerRef} className="w-full" style={{ height: `${macdHeight}px` }} />
                </div>
              </>
            ) : (
              <div className="border-t border-[#2a2e39] bg-[#131722] p-4">
                <LockedFeatureCard
                  title="Indicators Locked"
                  description="Unlock the Technician path (complete Foundation + 10 trades) to access RSI and MACD."
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(ProfessionalCandlestickChart);