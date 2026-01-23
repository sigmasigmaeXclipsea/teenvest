import React, { useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from 'lucide-react';
import { createChart, ColorType } from "https://esm.sh/lightweight-charts@4.1.1";

interface StockLineChartProps {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  high: number;
  low: number;
  open: number;
}

const StockLineChart = ({ symbol, currentPrice, previousClose, high, low, open }: StockLineChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  // Generate price history data
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    const days = 30;
    
    let price = previousClose || currentPrice;
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic price movement
      const change = (Math.random() - 0.48) * 0.02 * price;
      price = Math.max(low * 0.95, Math.min(high * 1.05, price + change));
      
      data.push({
        time: Math.floor(date.getTime() / 1000) as any,
        value: Number(price.toFixed(2)),
      });
    }
    
    return data;
  }, [currentPrice, previousClose, high, low]);

  useEffect(() => {
    if (!chartContainerRef.current || !chartData || chartData.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
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
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.3)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
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
    });

    // Add area series for line chart
    const areaSeries = chart.addAreaSeries({
      lineColor: "#3b82f6",
      topColor: "rgba(59, 130, 246, 0.2)",
      bottomColor: "rgba(59, 130, 246, 0.0)",
      lineWidth: 2,
    });

    areaSeries.setData(chartData);
    chart.timeScale().fitContent();

    // Add price line at current price
    const priceLine = areaSeries.createPriceLine({
      price: currentPrice,
      color: 'rgba(59, 130, 246, 0.6)',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: 'Current',
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);
    chartRef.current = chart;

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [chartData, currentPrice]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <LineChart className="w-5 h-5" />
          Price Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartContainerRef} className="w-full h-[500px]" style={{ minHeight: '500px' }} />
      </CardContent>
    </Card>
  );
};

export default StockLineChart;
