import { useEffect, useMemo, useRef, useState } from 'react';
import { ComposedChart, Customized, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCandlestickData, type TimePeriod } from '@/hooks/useStockAPI';

type UserLine = {
  id: string;
  value: number;
  isCorrect?: boolean;
};

type CandlePoint = {
  index: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

const deriveZones = (data: CandlePoint[]) => {
  const lows = data.map((point) => point.low).sort((a, b) => a - b);
  const highs = data.map((point) => point.high).sort((a, b) => a - b);
  const closes = data.map((point) => point.close).sort((a, b) => a - b);
  const support = lows[Math.floor(lows.length * 0.15)] ?? lows[0];
  const mid = closes[Math.floor(closes.length * 0.5)] ?? closes[0];
  const resistance = highs[Math.floor(highs.length * 0.85)] ?? highs[highs.length - 1];
  return [support, mid, resistance].map((value) => Number(value.toFixed(1)));
};
const marginPercent = 0.02;

const stockUniverse = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'AMD', 'NFLX', 'GOOGL', 'SPY'];
const timeframe: TimePeriod = '3m';

const pickSymbol = (moduleId: string) => {
  if (!moduleId) return stockUniverse[0];
  let hash = 0;
  for (let i = 0; i < moduleId.length; i += 1) {
    hash = (hash * 31 + moduleId.charCodeAt(i)) % 100000;
  }
  return stockUniverse[hash % stockUniverse.length];
};

const ChartAnnotator = ({ moduleId }: { moduleId: string }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [userLines, setUserLines] = useState<UserLine[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  const symbol = useMemo(() => pickSymbol(moduleId), [moduleId]);
  const { data: candles, isLoading } = useCandlestickData(symbol, timeframe);

  const chartData = useMemo<CandlePoint[]>(() => {
    if (!candles || candles.length === 0) return [];
    const slice = candles.slice(-24);
    return slice.map((candle, index) => ({
      index,
      open: Number(candle.open.toFixed(1)),
      high: Number(candle.high.toFixed(1)),
      low: Number(candle.low.toFixed(1)),
      close: Number(candle.close.toFixed(1)),
    }));
  }, [candles]);

  const correctZones = useMemo(() => {
    if (chartData.length === 0) return [];
    return deriveZones(chartData);
  }, [chartData]);

  useEffect(() => {
    setUserLines([]);
    setHasChecked(false);
  }, [moduleId, symbol, chartData.length]);

  const priceBounds = useMemo(() => {
    const lows = chartData.map((point) => point.low);
    const highs = chartData.map((point) => point.high);
    return {
      min: Math.min(...lows),
      max: Math.max(...highs),
    };
  }, [chartData]);
  const minPrice = priceBounds.min;
  const maxPrice = priceBounds.max;

  useEffect(() => {
    if (!overlayRef.current) return;
    const updateBounds = () => {
      const rect = overlayRef.current?.getBoundingClientRect();
      if (rect) {
        setBounds({ width: rect.width, height: rect.height });
      }
    };
    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    observer.observe(overlayRef.current);
    return () => observer.disconnect();
  }, []);

  const valueToY = (value: number) => {
    if (bounds.height === 0) return 0;
    return ((maxPrice - value) / (maxPrice - minPrice)) * bounds.height;
  };

  const handleDropLine = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const value = maxPrice - (y / rect.height) * (maxPrice - minPrice);
    setUserLines((prev) => [
      ...prev,
      { id: `line-${Date.now()}-${prev.length}`, value: Number(value.toFixed(1)) },
    ]);
    setHasChecked(false);
  };

  const checkWork = () => {
    const used = new Set<number>();
    const nextLines = userLines.map((line) => {
      const matchIndex = correctZones.findIndex((zone, index) => {
        const withinMargin = Math.abs(line.value - zone) / zone <= marginPercent;
        return withinMargin && !used.has(index);
      });
      if (matchIndex !== -1) {
        used.add(matchIndex);
        return { ...line, isCorrect: true };
      }
      return { ...line, isCorrect: false };
    });
    setUserLines(nextLines);
    setHasChecked(true);
  };

  const clearLines = () => {
    setUserLines([]);
    setHasChecked(false);
  };

  const showGhostLines = hasChecked && userLines.some((line) => line.isCorrect === false);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card/80">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Chart Annotator
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          {symbol} • {timeframe.toUpperCase()} • Click to add support/resistance lines
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative h-80 w-full rounded-2xl border border-border/60 bg-secondary/30 p-4">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {isLoading ? 'Loading real market candles...' : 'No candlestick data available.'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="index" type="number" hide />
                <YAxis domain={[Math.max(0, minPrice - 15), maxPrice + 15]} hide />
                <Customized
                  component={({ width, height, xAxisMap, yAxisMap, data }: any) => {
                    const xAxis = Object.values(xAxisMap)[0] as any;
                    const yAxis = Object.values(yAxisMap)[0] as any;
                    if (!xAxis || !yAxis) return null;
                    const xScale = xAxis.scale as (value: number) => number;
                    const yScale = yAxis.scale as (value: number) => number;
                    const candleWidth = Math.max(8, (width / data.length) * 0.6);

                    return (
                      <g>
                        {data.map((entry: any, idx: number) => {
                          const x = xScale(entry.index) - candleWidth / 2;
                          const yHigh = yScale(entry.high);
                          const yLow = yScale(entry.low);
                          const yOpen = yScale(entry.open);
                          const yClose = yScale(entry.close);
                          const bullish = entry.close >= entry.open;
                          const bodyTop = Math.min(yOpen, yClose);
                          const bodyHeight = Math.max(6, Math.abs(yOpen - yClose));
                          return (
                            <g key={`candle-${idx}`}>
                              <line
                                x1={x + candleWidth / 2}
                                x2={x + candleWidth / 2}
                                y1={yHigh}
                                y2={yLow}
                                stroke={bullish ? '#22c55e' : '#ef4444'}
                                strokeWidth={2}
                              />
                              <rect
                                x={x}
                                y={bodyTop}
                                width={candleWidth}
                                height={bodyHeight}
                                rx={2}
                                fill={bullish ? '#16a34a' : '#dc2626'}
                              />
                            </g>
                          );
                        })}
                      </g>
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          <div
            ref={overlayRef}
            onClick={handleDropLine}
            className="absolute inset-0 cursor-crosshair"
            role="button"
            aria-label="Chart annotator"
          >
            <svg width={bounds.width} height={bounds.height} className="absolute inset-0">
              {showGhostLines &&
                correctZones.map((zone) => (
                  <line
                    key={`ghost-${zone}`}
                    x1={0}
                    x2={bounds.width}
                    y1={valueToY(zone)}
                    y2={valueToY(zone)}
                    stroke="rgba(148, 163, 184, 0.5)"
                    strokeDasharray="6 6"
                  />
                ))}

              {userLines.map((line) => {
                const y = valueToY(line.value);
                const isCorrect = line.isCorrect === true;
                const hasResult = line.isCorrect !== undefined;
                return (
                  <g key={line.id}>
                    <line
                      x1={0}
                      x2={bounds.width}
                      y1={y}
                      y2={y}
                      stroke={hasResult ? (isCorrect ? '#22c55e' : '#ef4444') : '#94a3b8'}
                      strokeWidth={2}
                    />
                    {hasResult && isCorrect && (
                      <text
                        x={bounds.width - 24}
                        y={y - 4}
                        fill="#22c55e"
                        fontSize="14"
                        fontWeight="700"
                      >
                        ✓
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={checkWork} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Check My Work
          </Button>
          <Button variant="outline" onClick={clearLines}>
            Clear Lines
          </Button>
          <div className="text-xs text-muted-foreground flex items-center">
            ±2% margin • {correctZones.length} zones
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartAnnotator;
