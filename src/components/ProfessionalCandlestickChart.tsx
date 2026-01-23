import { useMemo, useState, useRef, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createChart, ColorType } from "https://esm.sh/lightweight-charts@4.1.1";

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ProfessionalCandlestickChartProps {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  high: number;
  low: number;
  open: number;
}

type TimePeriod = '1d' | '5d' | '1m' | '3m' | '6m' | '1y';

const ProfessionalCandlestickChart = ({ symbol, currentPrice, previousClose, high, low, open }: ProfessionalCandlestickChartProps) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1m');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const volumeRef = useRef<any>(null);

  // Generate candlestick data with volume
  const candleData = useMemo(() => {
    const candles: CandleData[] = [];
    const today = new Date();
    let days = 30;
    let startDate = new Date(today);
    
    switch (timePeriod) {
      case '1d':
        days = 1;
        break;
      case '5d':
        days = 5;
        startDate.setDate(startDate.getDate() - 5);
        break;
      case '1m':
        days = 30;
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3m':
        days = 90;
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6m':
        days = 180;
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1y':
        days = 365;
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    let prevClose = previousClose || currentPrice * 0.95;
    const totalDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends
      if (date > today) break;
      
      const isToday = date.toDateString() === today.toDateString();
      
      if (isToday) {
        candles.push({
          date: date.toISOString().split('T')[0],
          open,
          high,
          low,
          close: currentPrice,
          volume: Math.floor(Math.random() * 50000000 + 10000000),
        });
      } else {
        const volatility = 0.025;
        const change = (Math.random() - 0.48) * volatility * prevClose;
        const dailyOpen = prevClose + (Math.random() - 0.5) * volatility * prevClose * 0.3;
        const dailyClose = prevClose + change;
        const dailyHigh = Math.max(dailyOpen, dailyClose) * (1 + Math.random() * volatility * 0.5);
        const dailyLow = Math.min(dailyOpen, dailyClose) * (1 - Math.random() * volatility * 0.5);
        
        candles.push({
          date: date.toISOString().split('T')[0],
          open: Number(dailyOpen.toFixed(2)),
          high: Number(dailyHigh.toFixed(2)),
          low: Number(dailyLow.toFixed(2)),
          close: Number(dailyClose.toFixed(2)),
          volume: Math.floor(Math.random() * 50000000 + 10000000),
        });
        
        prevClose = dailyClose;
      }
    }
    
    return candles;
  }, [open, high, low, currentPrice, previousClose, timePeriod]);

  useEffect(() => {
    if (!chartContainerRef.current || !volumeContainerRef.current || !candleData || candleData.length === 0) return;

    // Format data for lightweight-charts
    const formattedData = candleData.map((candle) => {
      const date = new Date(candle.date);
      return {
        time: Math.floor(date.getTime() / 1000) as any,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      };
    });

    const volumeData = candleData.map((candle) => {
      const date = new Date(candle.date);
      const isUp = candle.close >= candle.open;
      return {
        time: Math.floor(date.getTime() / 1000) as any,
        value: candle.volume,
        color: isUp ? '#26a69a' : '#ef5350',
      };
    });

    // Create main candlestick chart
    const chart = createChart(chartContainerRef.current, {
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
      width: chartContainerRef.current.clientWidth,
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

    // Create volume chart
    const volumeChart = createChart(volumeContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "hsl(var(--muted-foreground))",
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      width: volumeContainerRef.current.clientWidth,
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

    // Sync time scales
    chart.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
      if (timeRange) {
        volumeChart.timeScale().setVisibleRange(timeRange);
      }
    });

    volumeChart.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
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

    candlestickSeries.setData(formattedData);

    // Add volume series
    const volumeSeries = volumeChart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    volumeSeries.setData(volumeData);

    // Add previous close line
    const priceLine = candlestickSeries.createPriceLine({
      price: previousClose,
      color: 'rgba(148, 163, 184, 0.5)',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: 'Prev Close',
    });

    chart.timeScale().fitContent();
    volumeChart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && volumeContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        volumeChart.applyOptions({ width: volumeContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);
    chartRef.current = chart;
    volumeRef.current = volumeChart;

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      volumeChart.remove();
    };
  }, [candleData, previousClose]);

  const periodLabels: Record<TimePeriod, string> = {
    '1d': '1 Day',
    '5d': '5 Days',
    '1m': '1 Month',
    '3m': '3 Months',
    '6m': '6 Months',
    '1y': '1 Year'
  };

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
              <TabsTrigger value="1d" className="text-xs px-3">1D</TabsTrigger>
              <TabsTrigger value="5d" className="text-xs px-3">5D</TabsTrigger>
              <TabsTrigger value="1m" className="text-xs px-3">1M</TabsTrigger>
              <TabsTrigger value="3m" className="text-xs px-3">3M</TabsTrigger>
              <TabsTrigger value="6m" className="text-xs px-3">6M</TabsTrigger>
              <TabsTrigger value="1y" className="text-xs px-3">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-0">
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
          </div>
        </div>
        <div className="border-t border-border/50 pt-2">
          <div className="text-xs text-muted-foreground mb-2 px-1">Volume</div>
          <div ref={volumeContainerRef} className="w-full h-[150px]" style={{ minHeight: '150px' }} />
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(ProfessionalCandlestickChart);
