import { useEffect, useRef, useMemo, memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createChart, ColorType } from "lightweight-charts";
import { useCandlestickData, type TimePeriod } from '@/hooks/useStockAPI';

interface StockLineChartProps {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  high: number;
  low: number;
  open: number;
}

const toBusinessDayString = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toISOString().slice(0, 10);

const usesUnixTime = (p: TimePeriod) => ['1d', '5d', '1m', '3m'].includes(p);

const StockLineChart = ({ symbol, currentPrice, previousClose }: StockLineChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1m');
  const { data: candleData = [], isLoading, error } = useCandlestickData(symbol, timePeriod);

  const chartData = useMemo(() => {
    if (!candleData || candleData.length === 0) return [];

    const sorted = [...candleData].sort((a, b) => a.time - b.time);
    const unix = usesUnixTime(timePeriod);

    return sorted.map((c) => ({
      time: (unix ? c.time : toBusinessDayString(c.time)) as any,
      value: c.close,
    }));
  }, [candleData, timePeriod]);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el || !chartData || chartData.length === 0) return;

    // lightweight-charts can throw if the container is hidden (width=0) or gets detached.
    // Trade/Research tabs may mount charts while hidden; guard and fail-soft.
    const width = el.clientWidth;
    if (!width || width <= 0) return;

    // Ensure we don't leak previous instances if the effect re-runs.
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch {
        // ignore
      }
      chartRef.current = null;
    }

    const barSpacing = Math.max(3, Math.min(12, 800 / chartData.length));

    let chart: any;
    try {
      chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "hsl(var(--background))" },
        textColor: "hsl(var(--foreground))",
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      grid: {
        vertLines: { 
          color: "rgba(148, 163, 184, 0.1)",
          style: 1,
          visible: true,
        },
        horzLines: { 
          color: "rgba(148, 163, 184, 0.1)",
          style: 1,
          visible: true,
        },
      },
      width,
      height: 500,
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.3)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing,
        minBarSpacing: 1,
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.3)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "rgba(148, 163, 184, 0.5)",
          width: 1,
          style: 2,
          labelBackgroundColor: "hsl(var(--background))",
        },
        horzLine: {
          color: "rgba(148, 163, 184, 0.5)",
          width: 1,
          style: 2,
          labelBackgroundColor: "hsl(var(--background))",
        },
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: false, pinch: true },
      });
    } catch {
      return;
    }

    const isUp = currentPrice >= previousClose;
    const lineColor = isUp ? '#26a69a' : '#ef5350';

    // Add area series for line chart
    const areaSeries = chart.addAreaSeries({
      lineColor,
      topColor: isUp ? 'rgba(38, 166, 154, 0.18)' : 'rgba(239, 83, 80, 0.18)',
      bottomColor: isUp ? 'rgba(38, 166, 154, 0.0)' : 'rgba(239, 83, 80, 0.0)',
      lineWidth: 2,
    });

    areaSeries.setData(chartData);
    chart.timeScale().fitContent();

    // Add price line at current price
    areaSeries.createPriceLine({
      price: currentPrice,
      color: isUp ? 'rgba(38, 166, 154, 0.55)' : 'rgba(239, 83, 80, 0.55)',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: 'Current',
    });

    areaSeries.createPriceLine({
      price: previousClose,
      color: 'rgba(148, 163, 184, 0.4)',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: 'Prev Close',
    });

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
  }, [chartData, currentPrice, previousClose]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Price Trend
          </CardTitle>
          <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <TabsList className="h-8">
              <TabsTrigger value="1d" className="text-xs px-2">1D</TabsTrigger>
              <TabsTrigger value="5d" className="text-xs px-2">5D</TabsTrigger>
              <TabsTrigger value="1m" className="text-xs px-2">1M</TabsTrigger>
              <TabsTrigger value="3m" className="text-xs px-2">3M</TabsTrigger>
              <TabsTrigger value="6m" className="text-xs px-2">6M</TabsTrigger>
              <TabsTrigger value="1y" className="text-xs px-2">1Y</TabsTrigger>
              <TabsTrigger value="2y" className="text-xs px-2">2Y</TabsTrigger>
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
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[500px] text-muted-foreground">
            <p>No data available</p>
          </div>
        ) : (
          <div ref={chartContainerRef} className="w-full h-[500px]" style={{ minHeight: '500px' }} />
        )}
      </CardContent>
    </Card>
  );
};

export default memo(StockLineChart);
