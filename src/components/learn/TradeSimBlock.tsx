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
  headline?: string;
  summary?: string;
  stat?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  biasStrength?: number;
  newsImpactPrompted?: boolean;
};

const TradeSimBlock = ({
  symbol,
  startPrice,
  volatility = 0.02,
  steps = 10,
  headline,
  summary,
  stat,
  sentiment = 'neutral',
  biasStrength = 0,
  newsImpactPrompted = false,
}: TradeSimBlockProps) => {
  const ticksPerPress = 10;
  const prices = useMemo(() => {
    const series: number[] = [];
    let price = startPrice;
    series.push(price);

    for (let i = 1; i <= steps; i += 1) {
      const drift = Math.sin(i * 1.7) * volatility;
      const noise = Math.cos(i * 2.3) * 0.5 * volatility;
      const baseChange = drift + noise;
      let nextChange = baseChange;

      if (newsImpactPrompted && sentiment !== 'neutral' && biasStrength > 0) {
        const shouldBiasUp = sentiment === 'bullish';
        const roll = Math.random();
        const biasApplied = roll < biasStrength;
        if (biasApplied) {
          const biasSign = shouldBiasUp ? 1 : -1;
          nextChange = Math.abs(baseChange) * biasSign + biasSign * volatility * 0.25;
        }
      }

      price = Math.max(1, price * (1 + nextChange));
      series.push(Number(price.toFixed(2)));
    }

    return series;
  }, [startPrice, steps, volatility, sentiment, biasStrength, newsImpactPrompted]);

  const [stepIndex, setStepIndex] = useState(0);
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [position, setPosition] = useState<'long' | 'short' | null>(null);
  const [realizedPnl, setRealizedPnl] = useState(0);

  const currentPrice = prices[stepIndex] ?? startPrice;
  const hasPosition = entryPrice !== null && position !== null;
  const unrealized = hasPosition
    ? Number((position === 'long' ? currentPrice - entryPrice : entryPrice - currentPrice).toFixed(2))
    : 0;

  const moveNext = () => {
    setStepIndex((prev) => Math.min(prev + ticksPerPress, prices.length - 1));
  };

  const resetSim = () => {
    setStepIndex(0);
    setEntryPrice(null);
    setPosition(null);
    setRealizedPnl(0);
  };

  const openPosition = (nextPosition: 'long' | 'short') => {
    setPosition(nextPosition);
    setEntryPrice(currentPrice);
  };

  const closePosition = () => {
    if (!hasPosition || entryPrice === null || position === null) return;
    setRealizedPnl((prev) => Number((prev + unrealized).toFixed(2)));
    setEntryPrice(null);
    setPosition(null);
  };

  const sentimentStyles = {
    bullish: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
    bearish: 'border-destructive/30 bg-destructive/10 text-destructive',
    neutral: 'border-border/60 bg-secondary/40 text-muted-foreground',
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
        {(headline || summary || stat) && (
          <div className={`rounded-lg border px-3 py-2 text-xs ${sentimentStyles[sentiment]}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{headline ?? 'Market update'}</p>
              <span className="text-[10px] uppercase tracking-wide">
                {sentiment}
              </span>
            </div>
            {summary && <p className="mt-1">{summary}</p>}
            {stat && <p className="mt-1 font-medium">{stat}</p>}
            {newsImpactPrompted && biasStrength > 0 && (
              <p className="mt-1 text-[11px] font-semibold">
                News bias: {Math.round(biasStrength * 100)}% {sentiment === 'bullish' ? 'up' : 'down'} chance
              </p>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Current price</p>
            <p className="text-2xl font-semibold">${currentPrice.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground">Start price: ${startPrice.toFixed(2)}</p>
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
          {hasPosition && (
            <span>
              {position === 'long' ? 'Long' : 'Short'} @ ${entryPrice?.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {!hasPosition ? (
            <>
              <Button size="sm" onClick={() => openPosition('long')} className="gap-1">
                <TrendingUp className="w-4 h-4" />
                Buy
              </Button>
              <Button size="sm" variant="secondary" onClick={() => openPosition('short')} className="gap-1">
                <TrendingDown className="w-4 h-4" />
                Short
              </Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={closePosition} className="gap-1">
              <TrendingDown className="w-4 h-4" />
              {position === 'long' ? 'Sell' : 'Cover'}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={moveNext} disabled={stepIndex >= prices.length - 1}>
            Advance {ticksPerPress} ticks
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
            Use the news to decide whether to go long or short.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeSimBlock;
