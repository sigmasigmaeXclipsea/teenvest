import { TrendingUp, TrendingDown, Minus, Target, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ResearchAnalystRatingsProps {
  symbol: string;
}

const ResearchAnalystRatings = ({ symbol }: ResearchAnalystRatingsProps) => {
  // Mock analyst data
  const ratings = {
    strongBuy: 18,
    buy: 12,
    hold: 8,
    sell: 2,
    strongSell: 0,
    total: 40,
    consensus: 'Strong Buy',
    targetHigh: 250.00,
    targetLow: 165.00,
    targetMean: 210.50,
    targetMedian: 215.00,
    currentPrice: 189.50
  };

  const recentRatings = [
    { firm: 'Morgan Stanley', rating: 'Overweight', target: 220, date: '2024-01-15', change: 'Maintained' },
    { firm: 'Goldman Sachs', rating: 'Buy', target: 225, date: '2024-01-12', change: 'Upgraded' },
    { firm: 'JP Morgan', rating: 'Overweight', target: 215, date: '2024-01-10', change: 'Maintained' },
    { firm: 'Bank of America', rating: 'Buy', target: 210, date: '2024-01-08', change: 'Initiated' },
    { firm: 'Barclays', rating: 'Equal Weight', target: 195, date: '2024-01-05', change: 'Downgraded' },
    { firm: 'Citigroup', rating: 'Buy', target: 230, date: '2024-01-03', change: 'Reiterated' },
  ];

  const getRatingColor = (rating: string) => {
    const lower = rating.toLowerCase();
    if (lower.includes('buy') || lower.includes('overweight')) return 'text-emerald-500 bg-emerald-500/10';
    if (lower.includes('sell') || lower.includes('underweight')) return 'text-red-500 bg-red-500/10';
    return 'text-amber-500 bg-amber-500/10';
  };

  const getChangeIcon = (change: string) => {
    if (change === 'Upgraded') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (change === 'Downgraded') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const buyPercent = ((ratings.strongBuy + ratings.buy) / ratings.total) * 100;
  const holdPercent = (ratings.hold / ratings.total) * 100;
  const sellPercent = ((ratings.sell + ratings.strongSell) / ratings.total) * 100;

  return (
    <div className="space-y-6">
      {/* Consensus Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Analyst Consensus
            </CardTitle>
            <CardDescription>{ratings.total} analysts covering this stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <Badge className={`text-lg px-4 py-2 ${getRatingColor(ratings.consensus)}`}>
                {ratings.consensus}
              </Badge>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-emerald-500 font-medium">Buy ({ratings.strongBuy + ratings.buy})</span>
                  <span>{buyPercent.toFixed(0)}%</span>
                </div>
                <Progress value={buyPercent} className="h-3 bg-secondary [&>div]:bg-emerald-500" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-amber-500 font-medium">Hold ({ratings.hold})</span>
                  <span>{holdPercent.toFixed(0)}%</span>
                </div>
                <Progress value={holdPercent} className="h-3 bg-secondary [&>div]:bg-amber-500" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-500 font-medium">Sell ({ratings.sell + ratings.strongSell})</span>
                  <span>{sellPercent.toFixed(0)}%</span>
                </div>
                <Progress value={sellPercent} className="h-3 bg-secondary [&>div]:bg-red-500" />
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="mt-6 pt-4 border-t border-border grid grid-cols-5 gap-2 text-center text-sm">
              <div>
                <p className="font-bold text-emerald-600">{ratings.strongBuy}</p>
                <p className="text-xs text-muted-foreground">Strong Buy</p>
              </div>
              <div>
                <p className="font-bold text-emerald-500">{ratings.buy}</p>
                <p className="text-xs text-muted-foreground">Buy</p>
              </div>
              <div>
                <p className="font-bold text-amber-500">{ratings.hold}</p>
                <p className="text-xs text-muted-foreground">Hold</p>
              </div>
              <div>
                <p className="font-bold text-red-500">{ratings.sell}</p>
                <p className="text-xs text-muted-foreground">Sell</p>
              </div>
              <div>
                <p className="font-bold text-red-600">{ratings.strongSell}</p>
                <p className="text-xs text-muted-foreground">Strong Sell</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Price Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Target Range Visualization */}
              <div className="relative pt-8 pb-4">
                <div className="h-3 bg-gradient-to-r from-red-500/20 via-amber-500/20 to-emerald-500/20 rounded-full" />
                
                {/* Current Price Marker */}
                <div 
                  className="absolute top-0 flex flex-col items-center"
                  style={{ left: `${((ratings.currentPrice - ratings.targetLow) / (ratings.targetHigh - ratings.targetLow)) * 100}%` }}
                >
                  <span className="text-xs font-medium">Current</span>
                  <span className="text-sm font-bold">${ratings.currentPrice}</span>
                  <div className="w-0.5 h-4 bg-foreground" />
                </div>

                <div className="flex justify-between mt-2 text-sm">
                  <div className="text-red-500">
                    <p className="font-medium">Low</p>
                    <p className="font-bold">${ratings.targetLow}</p>
                  </div>
                  <div className="text-center text-emerald-500">
                    <p className="font-medium">Average</p>
                    <p className="font-bold">${ratings.targetMean}</p>
                  </div>
                  <div className="text-emerald-600">
                    <p className="font-medium">High</p>
                    <p className="font-bold">${ratings.targetHigh}</p>
                  </div>
                </div>
              </div>

              {/* Upside/Downside */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-emerald-500/10 text-center">
                  <p className="text-sm text-muted-foreground">Upside to Average</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    +{(((ratings.targetMean - ratings.currentPrice) / ratings.currentPrice) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-500/10 text-center">
                  <p className="text-sm text-muted-foreground">Upside to High</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    +{(((ratings.targetHigh - ratings.currentPrice) / ratings.currentPrice) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Analyst Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Analyst Actions</CardTitle>
          <CardDescription>Latest rating changes and price target updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentRatings.map((rating, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  {getChangeIcon(rating.change)}
                  <div>
                    <p className="font-medium">{rating.firm}</p>
                    <p className="text-sm text-muted-foreground">{rating.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getRatingColor(rating.rating)}>{rating.rating}</Badge>
                  <div className="text-right">
                    <p className="font-medium">${rating.target}</p>
                    <p className="text-xs text-muted-foreground">{rating.change}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResearchAnalystRatings;