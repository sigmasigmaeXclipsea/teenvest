import React, { useEffect, useRef } from "react";
// We import the pro library directly from the web—no installation needed!
import { createChart, ColorType } from "https://esm.sh/lightweight-charts@4.1.1";

const StockPriceChart = ({ data = [], height = 400 }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    // 1. Create the Chart Canvas
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.05)" },
        horzLines: { color: "rgba(148, 163, 184, 0.05)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
      },
    });

    // 2. Decide: Are we drawing Candlesticks or a Line?
    const hasOHLC = data[0] && "open" in data[0] && "high" in data[0];

    if (hasOHLC) {
      // Add Candlesticks (The pro bar graphs you want)
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });
      candlestickSeries.setData(data);
    } else {
      // Fallback to a sleek Area Chart if data is simple
      const areaSeries = chart.addAreaSeries({
        lineColor: "#3b82f6",
        topColor: "rgba(59, 130, 246, 0.2)",
        bottomColor: "rgba(59, 130, 246, 0.0)",
        lineWidth: 2,
      });
      // Map simple {date, price} to {time, value}
      const formattedData = data.map((d: any) => ({
        time: d.time || d.date,
        value: d.value || d.price || d.close,
      }));
      areaSeries.setData(formattedData);
    }

    chart.timeScale().fitContent();

    // 3. Make it responsive (resizes when the window does)
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, height]);

  return (
    <div className="w-full relative rounded-2xl border bg-card/30 p-4 shadow-sm backdrop-blur-sm overflow-hidden">
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
};

export default StockPriceChart;
