import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type TradeSimBlockProps = {
  symbol: string;
  startPrice: number;
  volatility?: number;
  steps?: number;
};

const TradeSimBlock = ({ symbol, startPrice, volatility = 0.02, steps = 10 }: TradeSimBlockProps) => {
  const prices = useMemo(() => {
    const series: number[] = [];
    let price = startPrice;
    series.push(price);

    for (let i = 1; i <= steps; i += 1) {
      const drift = Math.sin(i * 1.7) * volatility;
      const noise = Math.cos(i * 2.3) * 0.5 * volatility;
      const change = drift + noise;
      price = Math.max(1, price * (1 + change));
      series.push(Number(price.toFixed(2)));
    }

    return series;
  }, [startPrice, steps, volatility]);

  const [stepIndex, setStepIndex] = useState(0);
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [realizedPnl, setRealizedPnl] = useState(0);

  const currentPrice = prices[stepIndex] ?? startPrice;
  const hasPosition = entryPrice !== null;
  const unrealized = hasPosition ? Number((currentPrice - entryPrice).toFixed(2)) : 0;

  const moveNext = () => {
    setStepIndex((prev) => Math.min(prev + 1, prices.length - 1));
  };

  const resetSim = () => {
    setStepIndex(0);
    setEntryPrice(null);
    setRealizedPnl(0);
  };

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/5 via-card to-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          Trade Challenge
          <Badge variant="secondary">{symbol}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Current price</p>
            <p className="text-2xl font-semibold">${currentPrice.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Unrealized P/L</p>
            <p className={`text-lg font-semibold ${unrealized >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {unrealized >= 0 ? '+' : ''}${unrealized.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Step {stepIndex + 1} / {prices.length}</span>
          {hasPosition && <span>Entry: ${entryPrice?.toFixed(2)}</span>}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setEntryPrice(currentPrice)}
            disabled={hasPosition}
            className="gap-1"
          >
            <TrendingUp className="w-4 h-4" />
            Buy 1
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (entryPrice === null) return;
              setRealizedPnl((prev) => Number((prev + (currentPrice - entryPrice)).toFixed(2)));
              setEntryPrice(null);
            }}
            disabled={!hasPosition}
            className="gap-1"
          >
            <TrendingDown className="w-4 h-4" />
            Sell 1
          </Button>
          <Button size="sm" variant="outline" onClick={moveNext} disabled={stepIndex >= prices.length - 1}>
            Next tick
          </Button>
          <Button size="sm" variant="ghost" onClick={resetSim}>
            Reset
          </Button>
        </div>

        <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Realized P/L</span>
            <span className={`font-semibold ${realizedPnl >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {realizedPnl >= 0 ? '+' : ''}${realizedPnl.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Try buying before an upswing and selling after the move.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeSimBlock;
