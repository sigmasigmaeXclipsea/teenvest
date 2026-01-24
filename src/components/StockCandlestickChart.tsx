import { useMemo, useState, useRef, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createChart, ColorType } from "lightweight-charts";

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
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

    // Format data for lightweight-charts - need proper time format
    const formattedData = candleData.map((candle) => {
      // Parse date string back to timestamp for lightweight-charts
      let timestamp: number;
      if (candle.date === 'Today') {
        timestamp = Math.floor(Date.now() / 1000);
      } else {
        const date = new Date(candle.date + ', ' + new Date().getFullYear());
        timestamp = Math.floor(date.getTime() / 1000);
      }
      
      return {
        time: timestamp as any,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      };
    })
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

    candlestickSeries.setData(formattedData);
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
  
  // Generate simulated historical daily candles based on time period
  const candleData = useMemo(() => {
    const candles: CandleData[] = [];
    const today = new Date();
    let days = 20;
    let startDate = new Date(today);
    
    // Calculate days based on time period
    switch (timePeriod) {
      case '1d':
        days = 1;
        startDate = new Date(today);
        break;
      case '5d':
        days = 5;
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 5);
        break;
      case '1m':
        days = 30;
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'ytd':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        days = Math.ceil((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
        startDate = yearStart;
        break;
      case '1y':
        days = 365;
        startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    let prevClose = currentPrice * (1 - (Math.random() * 0.15 - 0.05));
    const totalDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const step = timePeriod === '1d' ? 1 : timePeriod === '5d' ? 1 : timePeriod === '1m' ? 1 : timePeriod === 'ytd' ? 1 : 7;
    
    for (let i = 0; i <= totalDays; i += step) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Skip weekends for daily data
      if (timePeriod !== '1y' && (date.getDay() === 0 || date.getDay() === 6)) continue;
      if (date > today) break;
      
      const isToday = date.toDateString() === today.toDateString();
      const dateStr = isToday ? 'Today' : date.toLocaleDateString('en-US', { 
        month: timePeriod === '1y' ? 'short' : 'short', 
        day: 'numeric',
        ...(timePeriod === '1y' && { year: '2-digit' })
      });
      
      if (isToday) {
        // Today's candle uses actual data
        candles.push({
          date: dateStr,
          open,
          high,
          low,
          close: currentPrice
        });
      } else {
        // Generate realistic candle
        const volatility = timePeriod === '1y' ? 0.04 : 0.025;
        const change = (Math.random() - 0.48) * volatility * prevClose;
        const dailyOpen = prevClose + (Math.random() - 0.5) * volatility * prevClose * 0.3;
        const dailyClose = prevClose + change;
        const dailyHigh = Math.max(dailyOpen, dailyClose) * (1 + Math.random() * volatility * 0.5);
        const dailyLow = Math.min(dailyOpen, dailyClose) * (1 - Math.random() * volatility * 0.5);
        
        candles.push({
          date: dateStr,
          open: Number(dailyOpen.toFixed(2)),
          high: Number(dailyHigh.toFixed(2)),
          low: Number(dailyLow.toFixed(2)),
          close: Number(dailyClose.toFixed(2))
        });
        
        prevClose = dailyClose;
      }
    }
    
    return candles;
  }, [open, high, low, currentPrice, timePeriod]);

  // Calculate data for rendering with proper candlestick structure
  const chartData = useMemo(() => {
    return candleData.map((candle, index) => {
      const isGreen = candle.close >= candle.open;
      const bodyTop = Math.max(candle.open, candle.close);
      const bodyBottom = Math.min(candle.open, candle.close);
      const bodyHeight = Math.abs(candle.close - candle.open) || 0.01; // Minimum height for visibility
      
      return {
        date: candle.date,
        index,
        // Body data
        bodyBottom,
        bodyHeight,
        bodyTop,
        // Wick data - we'll use Line components
        high: candle.high,
        low: candle.low,
        open: candle.open,
        close: candle.close,
        isGreen,
        // For wick lines - we need separate points for high and low wicks
        wickHighTop: candle.high,
        wickHighBottom: bodyTop,
        wickLowTop: bodyBottom,
        wickLowBottom: candle.low,
      };
    });
  }, [candleData]);

  const allPrices = candleData.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...allPrices) * 0.995;
  const maxPrice = Math.max(...allPrices) * 1.005;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]?.payload) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold mb-1">{data.date}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Open:</span>
          <span>${data.open.toFixed(2)}</span>
          <span className="text-muted-foreground">High:</span>
          <span>${data.high.toFixed(2)}</span>
          <span className="text-muted-foreground">Low:</span>
          <span>${data.low.toFixed(2)}</span>
          <span className="text-muted-foreground">Close:</span>
          <span className={data.isGreen ? 'text-primary' : 'text-destructive'}>
            ${data.close.toFixed(2)}
          </span>
        </div>
      </div>
    );
  };

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
            Price History
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
