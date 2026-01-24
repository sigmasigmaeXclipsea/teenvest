import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface ResearchVolumeWidgetProps {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
}

const ResearchVolumeWidget = ({ symbol, price, change, changePercent, volume, marketCap }: ResearchVolumeWidgetProps) => {
  // Format large numbers
  const formatNumber = (num: number | undefined) => {
    if (!num) return 'N/A';
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const isPositive = change >= 0;

  // Generate mock volume bars for visualization
  const volumeBars = useMemo(() => {
    const bars = [];
    const baseVolume = volume || 1000000;
    for (let i = 0; i < 20; i++) {
      const multiplier = 0.5 + Math.random();
      const barVolume = baseVolume * multiplier;
      const isUp = Math.random() > 0.45;
      bars.push({ volume: barVolume, isUp });
    }
    return bars;
  }, [volume]);

  const maxVolume = Math.max(...volumeBars.map(b => b.volume));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Market Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Price</p>
            <p className="text-2xl font-bold">${price.toFixed(2)}</p>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Volume</p>
            <p className="text-2xl font-bold">{formatNumber(volume)}</p>
            <p className="text-xs text-muted-foreground">shares traded</p>
          </div>
        </div>

        {/* Volume Visualization */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-2">20-Day Volume Pattern</p>
          <div className="flex items-end gap-0.5 h-16">
            {volumeBars.map((bar, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-sm transition-all ${bar.isUp ? 'bg-emerald-500/70' : 'bg-red-500/70'}`}
                style={{ height: `${(bar.volume / maxVolume) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>20 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Market Cap</p>
            <p className="font-semibold">{formatNumber(marketCap)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Volume (10D)</p>
            <p className="font-semibold">{formatNumber(volume ? volume * 0.9 : undefined)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(ResearchVolumeWidget);
