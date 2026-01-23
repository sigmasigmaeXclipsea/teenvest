import { Calendar, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ResearchEarningsCalendarProps {
  symbol: string;
}

const ResearchEarningsCalendar = ({ symbol }: ResearchEarningsCalendarProps) => {
  // Mock earnings data
  const upcomingEarnings = {
    date: '2024-02-01',
    time: 'After Market Close',
    fiscalQuarter: 'Q1 2024',
    epsEstimate: 2.10,
    revenueEstimate: 117.9
  };

  const earningsHistory = [
    { quarter: 'Q4 2023', date: '2023-11-02', epsEstimate: 1.39, epsActual: 1.46, surprise: 5.0, revenueEstimate: 89.3, revenueActual: 89.5 },
    { quarter: 'Q3 2023', date: '2023-08-03', epsEstimate: 1.19, epsActual: 1.26, surprise: 5.9, revenueEstimate: 81.5, revenueActual: 81.8 },
    { quarter: 'Q2 2023', date: '2023-05-04', epsEstimate: 1.43, epsActual: 1.52, surprise: 6.3, revenueEstimate: 92.9, revenueActual: 94.8 },
    { quarter: 'Q1 2023', date: '2023-02-02', epsEstimate: 1.94, epsActual: 1.88, surprise: -3.1, revenueEstimate: 121.1, revenueActual: 117.2 },
    { quarter: 'Q4 2022', date: '2022-11-03', epsEstimate: 1.27, epsActual: 1.29, surprise: 1.6, revenueEstimate: 88.8, revenueActual: 90.1 },
    { quarter: 'Q3 2022', date: '2022-07-28', epsEstimate: 1.16, epsActual: 1.20, surprise: 3.4, revenueEstimate: 82.6, revenueActual: 83.0 },
  ];

  const beatRate = earningsHistory.filter(e => e.surprise > 0).length / earningsHistory.length * 100;
  const avgSurprise = earningsHistory.reduce((acc, e) => acc + e.surprise, 0) / earningsHistory.length;

  return (
    <div className="space-y-6">
      {/* Upcoming Earnings */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Upcoming Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Report Date</p>
              <p className="text-2xl font-bold">{new Date(upcomingEarnings.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {upcomingEarnings.time}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fiscal Quarter</p>
              <p className="text-2xl font-bold">{upcomingEarnings.fiscalQuarter}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">EPS Estimate</p>
              <p className="text-2xl font-bold">${upcomingEarnings.epsEstimate.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue Estimate</p>
              <p className="text-2xl font-bold">${upcomingEarnings.revenueEstimate}B</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Performance Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Beat Rate</p>
                <p className="text-2xl font-bold">{beatRate.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${avgSurprise >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                <DollarSign className={`w-6 h-6 ${avgSurprise >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg EPS Surprise</p>
                <p className={`text-2xl font-bold ${avgSurprise >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {avgSurprise >= 0 ? '+' : ''}{avgSurprise.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quarters Tracked</p>
                <p className="text-2xl font-bold">{earningsHistory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
          <CardDescription>Past quarterly earnings results vs. estimates</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quarter</TableHead>
                <TableHead>Report Date</TableHead>
                <TableHead className="text-right">EPS Est.</TableHead>
                <TableHead className="text-right">EPS Actual</TableHead>
                <TableHead className="text-right">Surprise</TableHead>
                <TableHead className="text-right">Revenue (B)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earningsHistory.map((earning) => (
                <TableRow key={earning.quarter}>
                  <TableCell className="font-medium">{earning.quarter}</TableCell>
                  <TableCell>{new Date(earning.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                  <TableCell className="text-right">${earning.epsEstimate.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">${earning.epsActual.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={earning.surprise >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}>
                      {earning.surprise >= 0 ? '+' : ''}{earning.surprise.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-muted-foreground">${earning.revenueEstimate}</span>
                    {' → '}
                    <span className="font-medium">${earning.revenueActual}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* EPS Trend Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>EPS Trend</CardTitle>
          <CardDescription>Quarterly earnings per share over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-40 gap-2">
            {earningsHistory.slice().reverse().map((earning, idx) => {
              const maxEps = Math.max(...earningsHistory.map(e => e.epsActual));
              const height = (earning.epsActual / maxEps) * 100;
              return (
                <div key={earning.quarter} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className={`w-full rounded-t-lg transition-all ${earning.surprise >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-center">
                    <p className="text-xs font-medium">${earning.epsActual}</p>
                    <p className="text-xs text-muted-foreground">{earning.quarter.split(' ')[0]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResearchEarningsCalendar;