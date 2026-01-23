import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ResearchFinancialsProps {
  symbol: string;
}

const ResearchFinancials = ({ symbol }: ResearchFinancialsProps) => {
  const [period, setPeriod] = useState<'annual' | 'quarterly'>('annual');

  // Mock financial data (in production, this would come from an API)
  const incomeStatement = {
    annual: [
      { year: '2024', revenue: 385.6, grossProfit: 170.8, operatingIncome: 118.7, netIncome: 97.0, eps: 6.13 },
      { year: '2023', revenue: 383.3, grossProfit: 169.1, operatingIncome: 114.3, netIncome: 97.0, eps: 6.16 },
      { year: '2022', revenue: 394.3, grossProfit: 170.8, operatingIncome: 119.4, netIncome: 99.8, eps: 6.11 },
      { year: '2021', revenue: 365.8, grossProfit: 152.8, operatingIncome: 108.9, netIncome: 94.7, eps: 5.67 },
    ],
    quarterly: [
      { year: 'Q4 2024', revenue: 119.6, grossProfit: 54.9, operatingIncome: 40.4, netIncome: 33.9, eps: 2.18 },
      { year: 'Q3 2024', revenue: 94.9, grossProfit: 43.9, operatingIncome: 29.6, netIncome: 23.6, eps: 1.64 },
      { year: 'Q2 2024', revenue: 85.8, grossProfit: 39.7, operatingIncome: 25.4, netIncome: 21.4, eps: 1.40 },
      { year: 'Q1 2024', revenue: 90.8, grossProfit: 42.3, operatingIncome: 27.9, netIncome: 23.6, eps: 1.53 },
    ]
  };

  const balanceSheet = {
    totalAssets: 352.6,
    totalLiabilities: 290.4,
    totalEquity: 62.1,
    cash: 61.6,
    debt: 104.6,
    currentAssets: 143.6,
    currentLiabilities: 133.9
  };

  const cashFlow = {
    annual: [
      { year: '2024', operating: 118.3, investing: -7.1, financing: -110.1, freeCashFlow: 108.8 },
      { year: '2023', operating: 110.5, investing: -7.0, financing: -103.4, freeCashFlow: 99.6 },
      { year: '2022', operating: 122.2, investing: -22.4, financing: -110.7, freeCashFlow: 111.4 },
    ]
  };

  const formatBillion = (num: number) => `$${num.toFixed(1)}B`;
  const formatChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  const data = period === 'annual' ? incomeStatement.annual : incomeStatement.quarterly;

  return (
    <div className="space-y-6">
      {/* Period Toggle */}
      <div className="flex gap-2">
        <Badge 
          variant={period === 'annual' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setPeriod('annual')}
        >
          Annual
        </Badge>
        <Badge 
          variant={period === 'quarterly' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setPeriod('quarterly')}
        >
          Quarterly
        </Badge>
      </div>

      <Tabs defaultValue="income" className="space-y-4">
        <TabsList>
          <TabsTrigger value="income">Income Statement</TabsTrigger>
          <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Income Statement
              </CardTitle>
              <CardDescription>All figures in billions USD</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Gross Profit</TableHead>
                    <TableHead className="text-right">Operating Income</TableHead>
                    <TableHead className="text-right">Net Income</TableHead>
                    <TableHead className="text-right">EPS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, idx) => (
                    <TableRow key={row.year}>
                      <TableCell className="font-medium">{row.year}</TableCell>
                      <TableCell className="text-right">
                        {formatBillion(row.revenue)}
                        {idx < data.length - 1 && (
                          <span className={`ml-2 text-xs ${formatChange(row.revenue, data[idx + 1].revenue) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {formatChange(row.revenue, data[idx + 1].revenue) >= 0 ? '+' : ''}
                            {formatChange(row.revenue, data[idx + 1].revenue).toFixed(1)}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatBillion(row.grossProfit)}</TableCell>
                      <TableCell className="text-right">{formatBillion(row.operatingIncome)}</TableCell>
                      <TableCell className="text-right">{formatBillion(row.netIncome)}</TableCell>
                      <TableCell className="text-right">${row.eps.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Balance Sheet
              </CardTitle>
              <CardDescription>Most recent quarter - All figures in billions USD</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Assets</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Assets</span>
                      <span className="font-medium">{formatBillion(balanceSheet.totalAssets)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Assets</span>
                      <span className="font-medium">{formatBillion(balanceSheet.currentAssets)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash & Equivalents</span>
                      <span className="font-medium">{formatBillion(balanceSheet.cash)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Liabilities & Equity</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Liabilities</span>
                      <span className="font-medium">{formatBillion(balanceSheet.totalLiabilities)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Liabilities</span>
                      <span className="font-medium">{formatBillion(balanceSheet.currentLiabilities)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Debt</span>
                      <span className="font-medium">{formatBillion(balanceSheet.debt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Equity</span>
                      <span className="font-medium">{formatBillion(balanceSheet.totalEquity)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Ratios */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">Key Ratios</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground">Current Ratio</p>
                    <p className="text-lg font-bold">{(balanceSheet.currentAssets / balanceSheet.currentLiabilities).toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground">Debt/Equity</p>
                    <p className="text-lg font-bold">{(balanceSheet.debt / balanceSheet.totalEquity).toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground">Quick Ratio</p>
                    <p className="text-lg font-bold">{((balanceSheet.currentAssets - 10) / balanceSheet.currentLiabilities).toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground">Cash Ratio</p>
                    <p className="text-lg font-bold">{(balanceSheet.cash / balanceSheet.currentLiabilities).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Cash Flow Statement
              </CardTitle>
              <CardDescription>Annual figures in billions USD</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Operating</TableHead>
                    <TableHead className="text-right">Investing</TableHead>
                    <TableHead className="text-right">Financing</TableHead>
                    <TableHead className="text-right">Free Cash Flow</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashFlow.annual.map((row) => (
                    <TableRow key={row.year}>
                      <TableCell className="font-medium">{row.year}</TableCell>
                      <TableCell className="text-right text-emerald-500">{formatBillion(row.operating)}</TableCell>
                      <TableCell className="text-right text-red-500">{formatBillion(row.investing)}</TableCell>
                      <TableCell className="text-right text-red-500">{formatBillion(row.financing)}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-500">{formatBillion(row.freeCashFlow)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResearchFinancials;