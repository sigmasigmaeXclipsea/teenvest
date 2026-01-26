import { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ScenarioChartBlockProps = {
  title: string;
  sliderLabel: string;
  sliderRange: { min: number; max: number; step?: number };
  seriesFormula?: 'compound' | 'linear';
};

const ScenarioChartBlock = ({
  title,
  sliderLabel,
  sliderRange,
  seriesFormula = 'compound',
}: ScenarioChartBlockProps) => {
  const [value, setValue] = useState(sliderRange.min);

  const result = useMemo(() => {
    const years = value;
    const principal = 100;
    const rate = 0.08;
    if (seriesFormula === 'linear') {
      return principal + years * 10;
    }
    return principal * Math.pow(1 + rate, years);
  }, [seriesFormula, value]);

  const maxResult = useMemo(() => {
    const max = sliderRange.max;
    const principal = 100;
    const rate = 0.08;
    if (seriesFormula === 'linear') {
      return principal + max * 10;
    }
    return principal * Math.pow(1 + rate, max);
  }, [seriesFormula, sliderRange.max]);

  const percent = Math.min(100, (result / maxResult) * 100);

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">
            {sliderLabel}: <span className="font-semibold text-foreground">{value}</span>
          </label>
          <input
            type="range"
            min={sliderRange.min}
            max={sliderRange.max}
            step={sliderRange.step ?? 1}
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
            className="w-full mt-2 accent-emerald-500"
          />
        </div>

        <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-3">
          <p className="text-xs text-muted-foreground">Estimated outcome</p>
          <p className="text-2xl font-semibold">${result.toFixed(0)}</p>
          <div className="mt-3 h-2 w-full rounded-full bg-emerald-500/10">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Drag the slider to see how time changes the outcome.
        </p>
      </CardContent>
    </Card>
  );
};

export default ScenarioChartBlock;
