import { useState } from 'react';
import { Activity, TrendingUp, TrendingDown, BarChart3, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAlphaIndicators } from '@/hooks/useAlphaIndicators';
import { useStockQuote } from '@/hooks/useStockAPI';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSkillTreeProgress } from '@/hooks/useSkillTreeProgress';
import LockedFeatureCard from '@/components/LockedFeatureCard';

interface ResearchTechnicalIndicatorsProps {
  symbol: string;
}

const getSignal = (indicator: 'rsi', value: number | null) => {
  if (value == null || Number.isNaN(value)) {
    return { signal: 'Neutral' as const, color: 'text-amber-500 bg-amber-500/10' };
  }
  if (indicator === 'rsi') {
    if (value < 30) return { signal: 'Buy' as const, color: 'text-emerald-500 bg-emerald-500/10' };
    if (value > 70) return { signal: 'Sell' as const, color: 'text-red-500 bg-red-500/10' };
  }
  return { signal: 'Neutral' as const, color: 'text-amber-500 bg-amber-500/10' };
};

const latest = <T extends { time: number }>(values?: T[]) =>
  values && values.length > 0 ? values[values.length - 1] : undefined;

const ResearchTechnicalIndicators = ({ symbol }: ResearchTechnicalIndicatorsProps) => {
  const [emaPeriod, setEmaPeriod] = useState(20);
  const emaOptions = [10, 20, 50, 100, 200];
  const { data: indicators, isLoading, error } = useAlphaIndicators(symbol, '6M', { emaPeriod });
  const { data: quote } = useStockQuote(symbol);
  const { unlocks } = useSkillTreeProgress();

  if (!unlocks.technician) {
    return (
      <LockedFeatureCard
        title="Indicators Locked"
        description="Unlock the Technician path (complete Foundation + 10 trades) to access RSI, MACD, and EMA insights."
      />
    );
  }

  if (isLoading && !indicators) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading indicators...
      </div>
    );
  }

  if (error || !indicators) {
    return (
      <div className="text-sm text-muted-foreground">
        Unable to load technical indicators right now.
      </div>
    );
  }

  const rsiPoint = latest(indicators.rsi?.values);
  const emaPoint = latest(indicators.ema?.values);
  const macdPoint = latest(indicators.macd?.values);

  const rsiValue = rsiPoint?.value ?? null;
  const macdHist = macdPoint?.hist ?? null;
  const currentPrice = quote?.price ?? null;

  const rsiSignal = getSignal('rsi', rsiValue);
  const macdSignal =
    macdHist == null
      ? { signal: 'Neutral' as const, color: 'text-amber-500 bg-amber-500/10' }
      : macdHist >= 0
        ? { signal: 'Buy' as const, color: 'text-emerald-500 bg-emerald-500/10' }
        : { signal: 'Sell' as const, color: 'text-red-500 bg-red-500/10' };

  const emaSignal =
    currentPrice != null && emaPoint?.value != null
      ? currentPrice > emaPoint.value
        ? { signal: 'Buy' as const, color: 'text-emerald-500 bg-emerald-500/10' }
        : { signal: 'Sell' as const, color: 'text-red-500 bg-red-500/10' }
      : { signal: 'Neutral' as const, color: 'text-amber-500 bg-amber-500/10' };

  const signals = [rsiSignal.signal, macdSignal.signal, emaSignal.signal];
  const buyCount = signals.filter((s) => s === 'Buy').length;
  const sellCount = signals.filter((s) => s === 'Sell').length;
  const overall =
    buyCount === sellCount ? 'Neutral' : buyCount > sellCount ? 'Bullish' : 'Bearish';

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Overall Signal</h3>
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  overall === 'Bullish'
                    ? 'bg-emerald-500/10'
                    : overall === 'Bearish'
                      ? 'bg-red-500/10'
                      : 'bg-amber-500/10'
                }`}
              >
                {overall === 'Bullish' ? (
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                ) : overall === 'Bearish' ? (
                  <TrendingDown className="w-6 h-6 text-red-500" />
                ) : (
                  <Activity className="w-6 h-6 text-amber-500" />
                )}
              </div>
              <div>
                <p
                  className={`text-xl font-bold ${
                    overall === 'Bullish'
                      ? 'text-emerald-500'
                      : overall === 'Bearish'
                        ? 'text-red-500'
                        : 'text-amber-500'
                  }`}
                >
                  {overall}
                </p>
                <p className="text-sm text-muted-foreground">
                  {buyCount} Buy / {sellCount} Sell
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">RSI (14)</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{rsiValue != null ? rsiValue.toFixed(1) : '--'}</span>
              <Badge className={rsiSignal.color}>{rsiSignal.signal}</Badge>
            </div>
            <Progress value={rsiValue ?? 0} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Oversold (30)</span>
              <span>Overbought (70)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">MACD</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">
                {macdPoint ? macdPoint.value.toFixed(2) : '--'}
              </span>
              <Badge className={macdSignal.color}>{macdSignal.signal}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>
                <p>Signal</p>
                <p className="text-foreground font-medium">
                  {macdPoint ? macdPoint.signal.toFixed(2) : '--'}
                </p>
              </div>
              <div>
                <p>Hist</p>
                <p className="text-foreground font-medium">
                  {macdPoint ? macdPoint.hist.toFixed(2) : '--'}
                </p>
              </div>
              <div>
                <p>Interval</p>
                <p className="text-foreground font-medium">{indicators.interval}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Oscillators
          </CardTitle>
          <CardDescription>RSI and MACD calculated from price data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">RSI (14)</span>
                <Badge className={rsiSignal.color}>{rsiSignal.signal}</Badge>
              </div>
              <Progress value={rsiValue ?? 0} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>30</span>
                <span>{rsiValue != null ? rsiValue.toFixed(1) : '--'}</span>
                <span>70</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">MACD (12, 26, 9)</span>
                <Badge className={macdSignal.color}>{macdSignal.signal}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">MACD</p>
                  <p className="font-medium">{macdPoint ? macdPoint.value.toFixed(2) : '--'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Signal</p>
                  <p className="font-medium">{macdPoint ? macdPoint.signal.toFixed(2) : '--'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hist</p>
                  <p className="font-medium">{macdPoint ? macdPoint.hist.toFixed(2) : '--'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Moving Averages
          </CardTitle>
          <CardDescription>
            Current Price: {currentPrice != null ? `$${currentPrice.toFixed(2)}` : '--'}
          </CardDescription>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">EMA period</span>
            <Select value={emaPeriod.toString()} onValueChange={(v) => setEmaPeriod(Number(v))}>
              <SelectTrigger className="h-7 w-[120px] px-2 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {emaOptions.map((period) => (
                  <SelectItem key={period} value={period.toString()}>
                    EMA {period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
              <span className="text-sm">EMA ({indicators.ema?.period ?? 20})</span>
              <div className="flex items-center gap-3">
                <span className="font-medium">
                  {emaPoint ? `$${emaPoint.value.toFixed(2)}` : '--'}
                </span>
                <Badge className={emaSignal.color}>{emaSignal.signal}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResearchTechnicalIndicators;
