import { Activity, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ResearchTechnicalIndicatorsProps {
  symbol: string;
}

const ResearchTechnicalIndicators = ({ symbol }: ResearchTechnicalIndicatorsProps) => {
  // Mock technical data
  const technicals = {
    rsi: 58.4,
    macd: { value: 2.15, signal: 1.89, histogram: 0.26 },
    stochastic: { k: 72.3, d: 68.1 },
    williams: -27.7,
    cci: 85.2,
    atr: 3.42,
    adx: 28.5,
    
    movingAverages: {
      sma10: 187.50,
      sma20: 185.20,
      sma50: 180.75,
      sma100: 175.30,
      sma200: 168.90,
      ema10: 188.10,
      ema20: 186.00,
      ema50: 181.50,
      ema100: 176.20,
      ema200: 170.50,
    },
    
    currentPrice: 189.50,
    
    pivotPoints: {
      r3: 198.50,
      r2: 195.20,
      r1: 192.30,
      pivot: 189.00,
      s1: 186.10,
      s2: 182.80,
      s3: 179.90
    },
    
    bollingerBands: {
      upper: 198.75,
      middle: 185.20,
      lower: 171.65
    }
  };

  const getSignal = (indicator: string, value: number): { signal: 'Buy' | 'Sell' | 'Neutral'; color: string } => {
    switch (indicator) {
      case 'rsi':
        if (value < 30) return { signal: 'Buy', color: 'text-emerald-500 bg-emerald-500/10' };
        if (value > 70) return { signal: 'Sell', color: 'text-red-500 bg-red-500/10' };
        return { signal: 'Neutral', color: 'text-amber-500 bg-amber-500/10' };
      case 'stochastic':
        if (value < 20) return { signal: 'Buy', color: 'text-emerald-500 bg-emerald-500/10' };
        if (value > 80) return { signal: 'Sell', color: 'text-red-500 bg-red-500/10' };
        return { signal: 'Neutral', color: 'text-amber-500 bg-amber-500/10' };
      case 'cci':
        if (value < -100) return { signal: 'Buy', color: 'text-emerald-500 bg-emerald-500/10' };
        if (value > 100) return { signal: 'Sell', color: 'text-red-500 bg-red-500/10' };
        return { signal: 'Neutral', color: 'text-amber-500 bg-amber-500/10' };
      default:
        return { signal: 'Neutral', color: 'text-amber-500 bg-amber-500/10' };
    }
  };

  const maSignal = (ma: number): { signal: 'Buy' | 'Sell'; icon: any } => {
    return technicals.currentPrice > ma 
      ? { signal: 'Buy', icon: TrendingUp }
      : { signal: 'Sell', icon: TrendingDown };
  };

  // Count buy/sell signals
  const maValues = Object.values(technicals.movingAverages);
  const buyCount = maValues.filter(ma => technicals.currentPrice > ma).length;
  const sellCount = maValues.filter(ma => technicals.currentPrice <= ma).length;

  const oscillatorSignals = [
    getSignal('rsi', technicals.rsi),
    getSignal('stochastic', technicals.stochastic.k),
    getSignal('cci', technicals.cci),
    technicals.macd.histogram > 0 
      ? { signal: 'Buy' as const, color: 'text-emerald-500 bg-emerald-500/10' }
      : { signal: 'Sell' as const, color: 'text-red-500 bg-red-500/10' }
  ];
  const oscBuyCount = oscillatorSignals.filter(s => s.signal === 'Buy').length;
  const oscSellCount = oscillatorSignals.filter(s => s.signal === 'Sell').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Overall Signal</h3>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                buyCount + oscBuyCount > sellCount + oscSellCount ? 'bg-emerald-500/10' : 'bg-red-500/10'
              }`}>
                {buyCount + oscBuyCount > sellCount + oscSellCount 
                  ? <TrendingUp className="w-6 h-6 text-emerald-500" />
                  : <TrendingDown className="w-6 h-6 text-red-500" />
                }
              </div>
              <div>
                <p className={`text-xl font-bold ${
                  buyCount + oscBuyCount > sellCount + oscSellCount ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {buyCount + oscBuyCount > sellCount + oscSellCount ? 'Bullish' : 'Bearish'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {buyCount + oscBuyCount} Buy / {sellCount + oscSellCount} Sell
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Moving Averages</h3>
            <Progress value={(buyCount / maValues.length) * 100} className="h-3 mb-2" />
            <div className="flex justify-between text-sm">
              <span className="text-emerald-500">{buyCount} Buy</span>
              <span className="text-red-500">{sellCount} Sell</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Oscillators</h3>
            <Progress value={(oscBuyCount / oscillatorSignals.length) * 100} className="h-3 mb-2" />
            <div className="flex justify-between text-sm">
              <span className="text-emerald-500">{oscBuyCount} Buy</span>
              <span className="text-red-500">{oscSellCount} Sell</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Oscillators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Oscillators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* RSI */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">RSI (14)</span>
                <Badge className={getSignal('rsi', technicals.rsi).color}>
                  {getSignal('rsi', technicals.rsi).signal}
                </Badge>
              </div>
              <div className="relative">
                <Progress value={technicals.rsi} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Oversold (30)</span>
                  <span className="font-medium">{technicals.rsi.toFixed(1)}</span>
                  <span>Overbought (70)</span>
                </div>
              </div>
            </div>

            {/* Stochastic */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Stochastic %K</span>
                <Badge className={getSignal('stochastic', technicals.stochastic.k).color}>
                  {getSignal('stochastic', technicals.stochastic.k).signal}
                </Badge>
              </div>
              <div className="relative">
                <Progress value={technicals.stochastic.k} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Oversold (20)</span>
                  <span className="font-medium">%K: {technicals.stochastic.k.toFixed(1)} | %D: {technicals.stochastic.d.toFixed(1)}</span>
                  <span>Overbought (80)</span>
                </div>
              </div>
            </div>

            {/* MACD */}
            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">MACD</span>
                <Badge className={technicals.macd.histogram > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}>
                  {technicals.macd.histogram > 0 ? 'Buy' : 'Sell'}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">MACD Line</p>
                  <p className="font-medium">{technicals.macd.value.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Signal</p>
                  <p className="font-medium">{technicals.macd.signal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Histogram</p>
                  <p className={`font-medium ${technicals.macd.histogram > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {technicals.macd.histogram.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Other Indicators */}
            <div className="p-4 rounded-lg bg-secondary/50">
              <h4 className="font-medium mb-3">Other Indicators</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CCI (20)</span>
                  <span className="font-medium">{technicals.cci.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Williams %R</span>
                  <span className="font-medium">{technicals.williams.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ADX (14)</span>
                  <span className="font-medium">{technicals.adx.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ATR (14)</span>
                  <span className="font-medium">{technicals.atr.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moving Averages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Moving Averages
          </CardTitle>
          <CardDescription>Current Price: ${technicals.currentPrice.toFixed(2)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Simple Moving Averages */}
            <div>
              <h4 className="font-medium mb-3">Simple Moving Averages (SMA)</h4>
              <div className="space-y-2">
                {[
                  { period: 10, value: technicals.movingAverages.sma10 },
                  { period: 20, value: technicals.movingAverages.sma20 },
                  { period: 50, value: technicals.movingAverages.sma50 },
                  { period: 100, value: technicals.movingAverages.sma100 },
                  { period: 200, value: technicals.movingAverages.sma200 },
                ].map(ma => {
                  const signal = maSignal(ma.value);
                  return (
                    <div key={`sma-${ma.period}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                      <span className="text-sm">SMA ({ma.period})</span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">${ma.value.toFixed(2)}</span>
                        <Badge className={signal.signal === 'Buy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}>
                          <signal.icon className="w-3 h-3 mr-1" />
                          {signal.signal}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Exponential Moving Averages */}
            <div>
              <h4 className="font-medium mb-3">Exponential Moving Averages (EMA)</h4>
              <div className="space-y-2">
                {[
                  { period: 10, value: technicals.movingAverages.ema10 },
                  { period: 20, value: technicals.movingAverages.ema20 },
                  { period: 50, value: technicals.movingAverages.ema50 },
                  { period: 100, value: technicals.movingAverages.ema100 },
                  { period: 200, value: technicals.movingAverages.ema200 },
                ].map(ma => {
                  const signal = maSignal(ma.value);
                  return (
                    <div key={`ema-${ma.period}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                      <span className="text-sm">EMA ({ma.period})</span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">${ma.value.toFixed(2)}</span>
                        <Badge className={signal.signal === 'Buy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}>
                          <signal.icon className="w-3 h-3 mr-1" />
                          {signal.signal}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pivot Points & Bollinger Bands */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pivot Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: 'R3 (Resistance)', value: technicals.pivotPoints.r3, color: 'text-red-500' },
                { label: 'R2 (Resistance)', value: technicals.pivotPoints.r2, color: 'text-red-400' },
                { label: 'R1 (Resistance)', value: technicals.pivotPoints.r1, color: 'text-red-300' },
                { label: 'Pivot Point', value: technicals.pivotPoints.pivot, color: 'text-amber-500 font-bold' },
                { label: 'S1 (Support)', value: technicals.pivotPoints.s1, color: 'text-emerald-300' },
                { label: 'S2 (Support)', value: technicals.pivotPoints.s2, color: 'text-emerald-400' },
                { label: 'S3 (Support)', value: technicals.pivotPoints.s3, color: 'text-emerald-500' },
              ].map(pivot => (
                <div key={pivot.label} className="flex justify-between items-center p-2 rounded-lg hover:bg-secondary/50">
                  <span className={`text-sm ${pivot.color}`}>{pivot.label}</span>
                  <span className="font-medium">${pivot.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bollinger Bands (20, 2)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-red-500/10">
                <span className="text-red-500">Upper Band</span>
                <span className="font-bold">${technicals.bollingerBands.upper.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-amber-500/10">
                <span className="text-amber-500">Middle Band (SMA 20)</span>
                <span className="font-bold">${technicals.bollingerBands.middle.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10">
                <span className="text-emerald-500">Lower Band</span>
                <span className="font-bold">${technicals.bollingerBands.lower.toFixed(2)}</span>
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground mb-1">Band Width</p>
                <p className="font-medium">
                  {(((technicals.bollingerBands.upper - technicals.bollingerBands.lower) / technicals.bollingerBands.middle) * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResearchTechnicalIndicators;
