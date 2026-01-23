import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface StockData {
  symbol: string;
  company_name: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number | null;
  market_cap: number | null;
  high: number | null;
  low: number | null;
  sector: string | null;
}

interface ResearchKeyStatsProps {
  symbol: string;
  stockData?: StockData;
}

const ResearchKeyStats = ({ symbol, stockData }: ResearchKeyStatsProps) => {
  // Mock additional stats (in production would come from API)
  const stats = {
    peRatio: 28.5,
    forwardPE: 25.2,
    pegRatio: 2.1,
    priceToSales: 7.8,
    priceToBook: 45.2,
    eps: 6.13,
    beta: 1.28,
    week52High: 199.62,
    week52Low: 164.08,
    avgVolume: 58900000,
    sharesOutstanding: 15820000000,
    dividendYield: 0.52,
    exDividendDate: '2024-02-09',
    targetPrice: 210.50,
    shortRatio: 1.2,
    shortPercent: 0.8
  };

  const price = stockData?.price || 0;
  const week52Position = stats.week52High > stats.week52Low 
    ? ((price - stats.week52Low) / (stats.week52High - stats.week52Low)) * 100 
    : 50;

  const StatCard = ({ title, value, subtitle, icon: Icon, trend }: { 
    title: string; 
    value: string | number; 
    subtitle?: string; 
    icon?: any;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        {Icon && <Icon className={`w-4 h-4 ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`} />}
      </div>
      <p className="text-xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Valuation Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Valuation Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="P/E Ratio (TTM)" value={stats.peRatio.toFixed(2)} subtitle="Trailing 12 months" />
            <StatCard title="Forward P/E" value={stats.forwardPE.toFixed(2)} subtitle="Next 12 months estimate" />
            <StatCard title="PEG Ratio" value={stats.pegRatio.toFixed(2)} subtitle="P/E to growth" />
            <StatCard title="Price/Sales" value={stats.priceToSales.toFixed(2)} />
            <StatCard title="Price/Book" value={stats.priceToBook.toFixed(2)} />
            <StatCard title="EPS (TTM)" value={`$${stats.eps.toFixed(2)}`} subtitle="Earnings per share" />
            <StatCard title="Market Cap" value={stockData?.market_cap ? `$${(stockData.market_cap / 1e12).toFixed(2)}T` : 'N/A'} />
            <StatCard title="Enterprise Value" value={stockData?.market_cap ? `$${((stockData.market_cap * 1.05) / 1e12).toFixed(2)}T` : 'N/A'} />
          </div>
        </CardContent>
      </Card>

      {/* Trading Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Trading Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 52-Week Range */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">52-Week Range</span>
              <span className="font-medium">${stats.week52Low.toFixed(2)} - ${stats.week52High.toFixed(2)}</span>
            </div>
            <div className="relative">
              <Progress value={week52Position} className="h-2" />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background"
                style={{ left: `calc(${week52Position}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Low: ${stats.week52Low.toFixed(2)}</span>
              <span>Current: ${price.toFixed(2)}</span>
              <span>High: ${stats.week52High.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              title="Volume" 
              value={stockData?.volume ? (stockData.volume / 1e6).toFixed(1) + 'M' : 'N/A'} 
              subtitle="Today's volume" 
            />
            <StatCard 
              title="Avg Volume" 
              value={(stats.avgVolume / 1e6).toFixed(1) + 'M'} 
              subtitle="10-day average" 
            />
            <StatCard title="Beta" value={stats.beta.toFixed(2)} subtitle="5Y monthly" />
            <StatCard 
              title="Day Range" 
              value={`$${stockData?.low?.toFixed(2) || '--'} - $${stockData?.high?.toFixed(2) || '--'}`} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Dividends & Shares */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dividend Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dividend Yield</span>
                <span className="font-medium">{stats.dividendYield.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Annual Dividend</span>
                <span className="font-medium">${(price * stats.dividendYield / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ex-Dividend Date</span>
                <span className="font-medium">{stats.exDividendDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payout Ratio</span>
                <span className="font-medium">15.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Share Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shares Outstanding</span>
                <span className="font-medium">{(stats.sharesOutstanding / 1e9).toFixed(2)}B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Float</span>
                <span className="font-medium">{(stats.sharesOutstanding * 0.99 / 1e9).toFixed(2)}B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Short % of Float</span>
                <span className="font-medium">{stats.shortPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Short Ratio</span>
                <span className="font-medium">{stats.shortRatio}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyst Target */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Price Target
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-3xl font-bold">${stats.targetPrice.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Average analyst target</p>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
              stats.targetPrice > price ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
            }`}>
              {stats.targetPrice > price ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-medium">
                {stats.targetPrice > price ? '+' : ''}
                {(((stats.targetPrice - price) / price) * 100).toFixed(1)}% upside
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResearchKeyStats;