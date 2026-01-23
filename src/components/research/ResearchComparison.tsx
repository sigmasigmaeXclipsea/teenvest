import { useState } from 'react';
import { GitCompare, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface StockData {
  symbol: string;
  company_name: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number | null;
  market_cap: number | null;
  sector: string | null;
}

interface ResearchComparisonProps {
  primarySymbol: string;
  cachedStocks: StockData[];
}

const ResearchComparison = ({ primarySymbol, cachedStocks }: ResearchComparisonProps) => {
  const [compareSymbols, setCompareSymbols] = useState<string[]>([primarySymbol]);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock additional metrics for comparison
  const mockMetrics: Record<string, any> = {
    default: {
      peRatio: 25.4,
      forwardPE: 22.1,
      eps: 5.67,
      dividendYield: 0.5,
      beta: 1.2,
      marketCap: 2800000000000,
      revenue: 385.6,
      netIncome: 97.0,
      profitMargin: 25.2,
      roe: 147.5,
      debtToEquity: 1.87,
      week52High: 199.62,
      week52Low: 164.08
    }
  };

  const getMetrics = (symbol: string) => {
    // Generate slightly randomized metrics based on symbol for demo
    const base = mockMetrics.default;
    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variance = (hash % 40 - 20) / 100; // -20% to +20% variance
    
    return {
      peRatio: base.peRatio * (1 + variance),
      forwardPE: base.forwardPE * (1 + variance),
      eps: base.eps * (1 + variance * 0.5),
      dividendYield: Math.max(0, base.dividendYield + variance),
      beta: Math.max(0.5, base.beta + variance * 0.5),
      profitMargin: base.profitMargin * (1 + variance * 0.3),
      roe: base.roe * (1 + variance * 0.5),
      debtToEquity: Math.max(0, base.debtToEquity + variance),
    };
  };

  const addSymbol = (symbol: string) => {
    if (compareSymbols.length < 4 && !compareSymbols.includes(symbol)) {
      setCompareSymbols([...compareSymbols, symbol]);
      setSearchQuery('');
    }
  };

  const removeSymbol = (symbol: string) => {
    if (compareSymbols.length > 1) {
      setCompareSymbols(compareSymbols.filter(s => s !== symbol));
    }
  };

  const filteredStocks = cachedStocks
    .filter(s => !compareSymbols.includes(s.symbol))
    .filter(s => 
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.company_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 5);

  const comparisonData = compareSymbols.map(symbol => {
    const stockData = cachedStocks.find(s => s.symbol === symbol);
    const metrics = getMetrics(symbol);
    return { symbol, stockData, metrics };
  });

  const getBestValue = (values: number[], higherIsBetter: boolean) => {
    if (higherIsBetter) {
      return Math.max(...values);
    }
    return Math.min(...values.filter(v => v > 0));
  };

  const ComparisonRow = ({ 
    label, 
    getValue, 
    format, 
    higherIsBetter = true,
    description 
  }: { 
    label: string; 
    getValue: (data: any) => number | string; 
    format: (v: number | string) => string;
    higherIsBetter?: boolean;
    description?: string;
  }) => {
    const values = comparisonData.map(d => {
      const val = getValue(d);
      return typeof val === 'number' ? val : 0;
    });
    const bestValue = typeof values[0] === 'number' ? getBestValue(values as number[], higherIsBetter) : null;

    return (
      <TableRow>
        <TableCell>
          <div>
            <span className="font-medium">{label}</span>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </TableCell>
        {comparisonData.map((data, idx) => {
          const value = getValue(data);
          const isBest = typeof value === 'number' && value === bestValue;
          return (
            <TableCell key={data.symbol} className="text-center">
              <span className={isBest ? 'text-emerald-500 font-bold' : ''}>
                {format(value)}
              </span>
            </TableCell>
          );
        })}
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stock Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            Compare Stocks
          </CardTitle>
          <CardDescription>Select up to 4 stocks to compare side-by-side</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            {compareSymbols.map(symbol => {
              const stock = cachedStocks.find(s => s.symbol === symbol);
              return (
                <Badge key={symbol} variant="secondary" className="px-3 py-2 text-sm">
                  <span className="font-bold mr-2">{symbol}</span>
                  <span className="text-muted-foreground mr-2">{stock?.company_name?.slice(0, 15)}...</span>
                  {compareSymbols.length > 1 && (
                    <button onClick={() => removeSymbol(symbol)} className="ml-1 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              );
            })}
          </div>

          {compareSymbols.length < 4 && (
            <div className="relative">
              <Input
                placeholder="Add stock to compare..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
              {searchQuery && filteredStocks.length > 0 && (
                <Card className="absolute top-full mt-1 w-80 z-50 shadow-lg">
                  <div className="py-2">
                    {filteredStocks.map(stock => (
                      <button
                        key={stock.symbol}
                        onClick={() => addSymbol(stock.symbol)}
                        className="w-full px-4 py-2 flex items-center justify-between hover:bg-secondary/50"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">{stock.symbol}</Badge>
                          <span className="text-sm truncate">{stock.company_name}</span>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {compareSymbols.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Side-by-Side Comparison</CardTitle>
            <CardDescription>Green highlights indicate the best value in each category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Metric</TableHead>
                    {comparisonData.map(data => (
                      <TableHead key={data.symbol} className="text-center min-w-[140px]">
                        <div>
                          <p className="font-bold">{data.symbol}</p>
                          <p className={`text-sm ${(data.stockData?.change_percent || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {(data.stockData?.change_percent || 0) >= 0 ? '+' : ''}
                            {data.stockData?.change_percent?.toFixed(2) || '0.00'}%
                          </p>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Price */}
                  <ComparisonRow
                    label="Price"
                    getValue={(d) => d.stockData?.price || 0}
                    format={(v) => `$${typeof v === 'number' ? v.toFixed(2) : v}`}
                    higherIsBetter={false}
                  />
                  
                  {/* Market Cap */}
                  <ComparisonRow
                    label="Market Cap"
                    getValue={(d) => d.stockData?.market_cap || 0}
                    format={(v) => {
                      const num = typeof v === 'number' ? v : 0;
                      if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
                      if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
                      return `$${(num / 1e6).toFixed(2)}M`;
                    }}
                    higherIsBetter={true}
                  />

                  {/* P/E Ratio */}
                  <ComparisonRow
                    label="P/E Ratio"
                    description="Lower may indicate undervaluation"
                    getValue={(d) => d.metrics.peRatio}
                    format={(v) => typeof v === 'number' ? v.toFixed(2) : String(v)}
                    higherIsBetter={false}
                  />

                  {/* Forward P/E */}
                  <ComparisonRow
                    label="Forward P/E"
                    getValue={(d) => d.metrics.forwardPE}
                    format={(v) => typeof v === 'number' ? v.toFixed(2) : String(v)}
                    higherIsBetter={false}
                  />

                  {/* EPS */}
                  <ComparisonRow
                    label="EPS (TTM)"
                    getValue={(d) => d.metrics.eps}
                    format={(v) => `$${typeof v === 'number' ? v.toFixed(2) : v}`}
                    higherIsBetter={true}
                  />

                  {/* Dividend Yield */}
                  <ComparisonRow
                    label="Dividend Yield"
                    getValue={(d) => d.metrics.dividendYield}
                    format={(v) => `${typeof v === 'number' ? v.toFixed(2) : v}%`}
                    higherIsBetter={true}
                  />

                  {/* Beta */}
                  <ComparisonRow
                    label="Beta"
                    description="Volatility vs market"
                    getValue={(d) => d.metrics.beta}
                    format={(v) => typeof v === 'number' ? v.toFixed(2) : String(v)}
                    higherIsBetter={false}
                  />

                  {/* Profit Margin */}
                  <ComparisonRow
                    label="Profit Margin"
                    getValue={(d) => d.metrics.profitMargin}
                    format={(v) => `${typeof v === 'number' ? v.toFixed(1) : v}%`}
                    higherIsBetter={true}
                  />

                  {/* ROE */}
                  <ComparisonRow
                    label="Return on Equity"
                    getValue={(d) => d.metrics.roe}
                    format={(v) => `${typeof v === 'number' ? v.toFixed(1) : v}%`}
                    higherIsBetter={true}
                  />

                  {/* Debt to Equity */}
                  <ComparisonRow
                    label="Debt/Equity"
                    description="Lower indicates less leverage"
                    getValue={(d) => d.metrics.debtToEquity}
                    format={(v) => typeof v === 'number' ? v.toFixed(2) : String(v)}
                    higherIsBetter={false}
                  />
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex gap-4">
        {comparisonData.map(data => (
          <Button
            key={data.symbol}
            variant="outline"
            onClick={() => window.open(`/stocks/${data.symbol}`, '_blank')}
          >
            View {data.symbol} Charts
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ResearchComparison;