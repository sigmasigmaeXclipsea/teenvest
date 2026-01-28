import { useEffect, useMemo, useState } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const DEFAULTS = {
  open: 100,
  close: 115,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type VerticalSliderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  rangeClassName?: string;
  thumbClassName?: string;
};

const VerticalSlider = ({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  rangeClassName,
  thumbClassName,
}: VerticalSliderProps) => (
  <SliderPrimitive.Root
    orientation="vertical"
    value={[value]}
    min={min}
    max={max}
    step={step}
    onValueChange={(values) => onValueChange(values[0] ?? min)}
    className="relative flex h-44 w-6 touch-none select-none items-center"
  >
    <SliderPrimitive.Track className="relative h-full w-2 overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className={cn('absolute w-full bg-primary', rangeClassName)} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        'block h-4 w-4 rounded-full border-2 border-primary bg-background shadow',
        thumbClassName
      )}
    />
  </SliderPrimitive.Root>
);

const CandlestickBuilder = () => {
  const [open, setOpen] = useState(DEFAULTS.open);
  const [close, setClose] = useState(DEFAULTS.close);
  const [highOffset, setHighOffset] = useState(20);
  const [lowOffset, setLowOffset] = useState(15);

  useEffect(() => {
    const maxHighOffset = Math.max(0, 200 - open);
    const maxLowOffset = Math.max(0, open);
    const nextHighOffset = clamp(highOffset, 0, maxHighOffset);
    const nextLowOffset = clamp(lowOffset, 0, maxLowOffset);

    if (nextHighOffset !== highOffset) {
      setHighOffset(nextHighOffset);
    }
    if (nextLowOffset !== lowOffset) {
      setLowOffset(nextLowOffset);
    }

    if (close > open + nextHighOffset) {
      setHighOffset(clamp(close - open, 0, maxHighOffset));
    }
    if (close < open - nextLowOffset) {
      setLowOffset(clamp(open - close, 0, maxLowOffset));
    }
  }, [open, close, highOffset, lowOffset]);

  const high = useMemo(() => {
    return Math.min(200, Math.max(open + highOffset, open, close));
  }, [open, close, highOffset]);

  const low = useMemo(() => {
    return Math.max(0, Math.min(open - lowOffset, open, close));
  }, [open, close, lowOffset]);

  const ranges = useMemo(() => {
    const range = Math.max(1, high - low);
    return {
      range,
      bodyTop: (high - Math.max(open, close)) / range,
      bodyHeight: Math.max(0.08, Math.abs(open - close) / range),
      wickTop: 0,
      wickHeight: 1,
      bullish: close >= open,
    };
  }, [open, close, high, low]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card/80">
      <CardHeader>
        <CardTitle className="text-lg">Candlestick Builder</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
        <div className="relative flex items-center justify-center rounded-2xl border border-border/60 bg-secondary/40 p-6 min-h-[280px]">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.15),transparent_55%)]" />
          <div className="relative flex flex-col items-center">
            <div className="text-xs text-muted-foreground mb-3">Japanese candlestick</div>
            <div className="relative h-48 w-10">
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-1 rounded-full ${
                  ranges.bullish ? 'bg-emerald-400/80' : 'bg-rose-400/80'
                }`}
                style={{
                  top: `${ranges.wickTop * 100}%`,
                  height: `${ranges.wickHeight * 100}%`,
                }}
              />
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-8 rounded-md shadow-lg ${
                  ranges.bullish ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{
                  top: `${ranges.bodyTop * 100}%`,
                  height: `${ranges.bodyHeight * 100}%`,
                }}
              />
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Open {open} • High {high} • Low {low} • Close {close}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Open', value: open, setter: setOpen, color: 'text-primary', range: 'bg-primary', thumb: 'border-primary' },
            { label: 'High', value: highOffset, setter: setHighOffset, color: 'text-emerald-500', range: 'bg-emerald-500', thumb: 'border-emerald-500' },
            { label: 'Low', value: lowOffset, setter: setLowOffset, color: 'text-rose-500', range: 'bg-rose-500', thumb: 'border-rose-500' },
            { label: 'Close', value: close, setter: setClose, color: 'text-accent-foreground', range: 'bg-accent', thumb: 'border-accent' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <span className={`text-xs font-semibold ${item.color}`}>{item.label}</span>
              <VerticalSlider
                min={0}
                max={item.label === 'High' ? Math.max(0, 200 - open) : item.label === 'Low' ? Math.max(0, open) : 200}
                value={item.value}
                onValueChange={item.setter}
                rangeClassName={item.range}
                thumbClassName={item.thumb}
              />
              <span className="text-xs font-semibold text-foreground">
                {item.label === 'High' ? high : item.label === 'Low' ? low : item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CandlestickBuilder;
