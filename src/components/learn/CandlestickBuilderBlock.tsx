import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type CandlestickBuilderBlockProps = {
  title?: string;
  start?: { open: number; high: number; low: number; close: number };
  min?: number;
  max?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const CandlestickBuilderBlock = ({
  title = 'Candlestick Builder',
  start,
  min = 0,
  max = 200,
}: CandlestickBuilderBlockProps) => {
  const initial = useMemo(() => {
    const base = start ?? { open: 100, high: 115, low: 85, close: 115 };
    const o = clamp(base.open, min, max);
    const h = clamp(base.high, min, max);
    const l = clamp(base.low, min, max);
    const c = clamp(base.close, min, max);

    const highFixed = Math.max(h, o, c, l);
    const lowFixed = Math.min(l, o, c, highFixed);

    return {
      open: clamp(o, lowFixed, highFixed),
      high: highFixed,
      low: lowFixed,
      close: clamp(c, lowFixed, highFixed),
    };
  }, [max, min, start]);

  const [open, setOpen] = useState(initial.open);
  const [high, setHigh] = useState(initial.high);
  const [low, setLow] = useState(initial.low);
  const [close, setClose] = useState(initial.close);

  const derived = useMemo(() => {
    const nextHigh = Math.max(high, open, close, low);
    const nextLow = Math.min(low, open, close, nextHigh);
    return {
      open: clamp(open, nextLow, nextHigh),
      high: clamp(nextHigh, min, max),
      low: clamp(nextLow, min, max),
      close: clamp(close, nextLow, nextHigh),
    };
  }, [close, high, low, max, min, open]);

  const isBullish = derived.close >= derived.open;

  const chart = useMemo(() => {
    const height = 220;
    const width = 220;
    const padding = 18;

    const range = Math.max(1, derived.high - derived.low);
    const y = (value: number) => {
      const pct = (derived.high - value) / range;
      return padding + pct * (height - padding * 2);
    };

    const x = width / 2;
    const wickTop = y(derived.high);
    const wickBottom = y(derived.low);

    const bodyTop = y(Math.max(derived.open, derived.close));
    const bodyBottom = y(Math.min(derived.open, derived.close));
    const bodyHeight = Math.max(8, bodyBottom - bodyTop);

    return { width, height, x, wickTop, wickBottom, bodyTop, bodyHeight };
  }, [derived]);

  const slider = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    colorClass: string
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${colorClass}`}>{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-background/40 p-4">
          <div className="text-center text-sm text-muted-foreground mb-3">Japanese candlestick</div>
          <div className="flex items-center justify-center">
            <svg width={chart.width} height={chart.height} role="img" aria-label="candlestick">
              <line
                x1={chart.x}
                x2={chart.x}
                y1={chart.wickTop}
                y2={chart.wickBottom}
                stroke={isBullish ? '#10b981' : '#ef4444'}
                strokeWidth={3}
                strokeLinecap="round"
              />
              <rect
                x={chart.x - 22}
                y={chart.bodyTop}
                width={44}
                height={chart.bodyHeight}
                rx={12}
                fill={isBullish ? '#10b981' : '#ef4444'}
                opacity={0.9}
              />
            </svg>
          </div>
          <div className="mt-3 text-center text-sm text-muted-foreground">
            Open {derived.open} · High {derived.high} · Low {derived.low} · Close {derived.close}
          </div>
        </div>

        <div className="space-y-4">
          {slider('Open', open, (v) => setOpen(v), 'text-emerald-500')}
          {slider('High', high, (v) => setHigh(v), 'text-emerald-500')}
          {slider('Low', low, (v) => setLow(v), 'text-rose-500')}
          {slider('Close', close, (v) => setClose(v), 'text-violet-500')}
        </div>
      </CardContent>
    </Card>
  );
};

export default CandlestickBuilderBlock;
