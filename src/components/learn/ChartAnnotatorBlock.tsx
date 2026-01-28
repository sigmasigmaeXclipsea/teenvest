import { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type ChartAnnotatorBlockProps = {
  title?: string;
  symbol?: string;
  timeframe?: string;
};

type Line = { id: string; value: number };

const ChartAnnotatorBlock = ({
  title = 'Chart Annotator',
  symbol = 'NVDA',
  timeframe = '3M',
}: ChartAnnotatorBlockProps) => {
  const [lines, setLines] = useState<Line[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const series = useMemo(() => {
    const points: number[] = [];
    let value = 100;
    for (let i = 0; i < 40; i += 1) {
      const drift = Math.sin(i * 0.35) * 2.2;
      const noise = Math.cos(i * 0.9) * 1.4;
      value = Math.max(20, value + drift + noise);
      points.push(Number(value.toFixed(2)));
    }
    return points;
  }, []);

  const stats = useMemo(() => {
    const min = Math.min(...series);
    const max = Math.max(...series);
    return { min, max, range: Math.max(1, max - min) };
  }, [series]);

  const toY = (v: number, h: number, pad: number) => {
    const pct = (stats.max - v) / stats.range;
    return pad + pct * (h - pad * 2);
  };

  const onClick = (e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const y = e.clientY - rect.top;

    const height = rect.height;
    const pad = 14;
    const pct = (y - pad) / Math.max(1, height - pad * 2);
    const clampedPct = Math.min(1, Math.max(0, pct));

    const value = stats.max - clampedPct * stats.range;
    const rounded = Number(value.toFixed(2));

    setLines((prev) => [{ id: crypto.randomUUID(), value: rounded }, ...prev].slice(0, 5));
  };

  const clear = () => setLines([]);

  const width = 560;
  const height = 220;
  const pad = 14;

  const path = useMemo(() => {
    const stepX = (width - pad * 2) / Math.max(1, series.length - 1);
    return series
      .map((v, i) => {
        const x = pad + i * stepX;
        const y = toY(v, height, pad);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [series, stats.max, stats.range]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground">
          {symbol} · {timeframe} · Click the chart to add support/resistance lines
        </div>

        <div className="rounded-xl border bg-background/40 p-3">
          <svg
            ref={svgRef}
            width="100%"
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-[220px] cursor-crosshair"
            onClick={onClick}
            role="img"
            aria-label="price chart"
          >
            <rect x={0} y={0} width={width} height={height} fill="transparent" />

            <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth={2.5} />

            {lines.map((line) => {
              const y = toY(line.value, height, pad);
              return (
                <g key={line.id}>
                  <line x1={pad} x2={width - pad} y1={y} y2={y} stroke="rgba(148,163,184,0.65)" strokeWidth={1.5} strokeDasharray="6 6" />
                  <rect x={width - pad - 74} y={y - 11} width={74} height={20} rx={8} fill="rgba(15, 23, 42, 0.65)" />
                  <text x={width - pad - 37} y={y + 3} textAnchor="middle" fontSize={11} fill="white">
                    {line.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Lines: {lines.length}/5</div>
          <Button size="sm" variant="secondary" onClick={clear} disabled={lines.length === 0}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartAnnotatorBlock;
