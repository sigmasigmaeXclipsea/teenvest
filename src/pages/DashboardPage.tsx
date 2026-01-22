import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { usePortfolio, useHoldings } from '@/hooks/usePortfolio';
import { useMultipleStockQuotes } from '@/hooks/useStockAPI';
import { getTickerInfo } from '@/data/russell5000Tickers';
import PortfolioHealthAI from '@/components/PortfolioHealthAI';
import AIAssistantCard from '@/components/AIAssistantCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
const COLORS = ['hsl(142, 76%, 36%)', 'hsl(262, 83%, 58%)', 'hsl(200, 98%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(340, 82%, 52%)'];

const DashboardPage = () => {
  const { user } = useAuth();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio();
  const { data: holdings, isLoading: holdingsLoading } = useHoldings();

  // Get all holding symbols to fetch real-time prices
  const holdingSymbols = useMemo(() => {
    return holdings?.map(h => h.symbol).filter(Boolean) || [];
  }, [holdings]);

  // Fetch real-time stock prices for all holdings
  const { data: stockQuotes, isLoading: quotesLoading } = useMultipleStockQuotes(holdingSymbols);

  // Create a map of symbol -> current price for easy lookup
  const priceMap = useMemo(() => {
    const map = new Map<string, { price: number; sector: string }>();
    if (stockQuotes) {
      stockQuotes.forEach(quote => {
        if (quote && quote.symbol && quote.price > 0) {
          map.set(quote.symbol, { 
            price: quote.price,
            sector: quote.sector || getTickerInfo(quote.symbol)?.sector || 'Other'
          });
        }
      });
    }
    return map;
  }, [stockQuotes]);

  // Fetch user's starting balance from profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('starting_balance')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const startingBalance = profile?.starting_balance || 10000;
  const portfolioStats = useMemo(() => {
    if (!portfolio || !holdings) return null;

    const cashBalance = Number(portfolio.cash_balance);
    let investedValue = 0;
    
    holdings.forEach(holding => {
      const stockData = priceMap.get(holding.symbol);
      if (stockData && stockData.price > 0) {
        investedValue += Number(holding.shares) * stockData.price;
      } else {
        // Fallback to average cost if real-time price not available yet
        investedValue += Number(holding.shares) * Number(holding.average_cost);
      }
    });

    const totalValue = cashBalance + investedValue;
    const totalGain = totalValue - startingBalance;
    const gainPercent = (totalGain / startingBalance) * 100;

    return {
      totalValue,
      cashBalance,
      investedValue,
      totalGain,
      gainPercent,
    };
  }, [portfolio, holdings, priceMap, startingBalance]);

  const sectorData = useMemo(() => {
    if (!holdings) return [];

    const sectorMap = new Map<string, number>();
    
    holdings.forEach(holding => {
      const stockData = priceMap.get(holding.symbol);
      if (stockData) {
        const value = Number(holding.shares) * stockData.price;
        const sector = stockData.sector || 'Other';
        const current = sectorMap.get(sector) || 0;
        sectorMap.set(sector, current + value);
      }
    });

    return Array.from(sectorMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [holdings, priceMap]);

  if (portfolioLoading || holdingsLoading || quotesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading portfolio...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Track your portfolio performance</p>
          </div>
          <Link to="/trade">
            <Button className="gap-2">
              <Briefcase className="w-4 h-4" />
              Trade Now
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Portfolio Value
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${portfolioStats?.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`flex items-center text-sm mt-1 ${portfolioStats && portfolioStats.totalGain >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {portfolioStats && portfolioStats.totalGain >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                {portfolioStats ? `${portfolioStats.gainPercent.toFixed(2)}% all time` : '—'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cash Balance
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${portfolioStats?.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Available to invest</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Invested Value
              </CardTitle>
              <Briefcase className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${portfolioStats?.investedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{holdings?.length || 0} positions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Gain/Loss
              </CardTitle>
              {portfolioStats && portfolioStats.totalGain >= 0 ? (
                <TrendingUp className="w-4 h-4 text-primary" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolioStats && portfolioStats.totalGain >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {portfolioStats && portfolioStats.totalGain >= 0 ? '+' : ''}
                ${portfolioStats?.totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Since you started</p>
            </CardContent>
          </Card>
        </div>

        {/* Holdings and Diversity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Holdings */}
          <Card>
            <CardHeader>
              <CardTitle>Your Holdings</CardTitle>
              <CardDescription>Current stock positions</CardDescription>
            </CardHeader>
            <CardContent>
              {holdings && holdings.length > 0 ? (
                <div className="space-y-4">
                    {holdings.map((holding) => {
                    const stockData = priceMap.get(holding.symbol);
                    const currentPrice = stockData?.price || Number(holding.average_cost);
                    const currentValue = Number(holding.shares) * currentPrice;
                    const costBasis = Number(holding.shares) * Number(holding.average_cost);
                    const gain = currentValue - costBasis;
                    const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;

                    return (
                      <div key={holding.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div>
                          <p className="font-semibold">{holding.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {Number(holding.shares).toFixed(2)} shares @ ${Number(holding.average_cost).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${Number.isFinite(currentValue) ? currentValue.toFixed(2) : '0.00'}</p>
                          <p className={`text-sm ${gain >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            {gain >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">No holdings yet. Start trading!</p>
                  <Link to="/trade">
                    <Button>Make Your First Trade</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolio Diversity */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Diversity</CardTitle>
              <CardDescription>Allocation by sector</CardDescription>
            </CardHeader>
            <CardContent>
              {sectorData.length > 0 ? (
                <div className="flex items-center gap-6">
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sectorData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                        >
                          {sectorData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {sectorData.map((sector, index) => (
                      <div key={sector.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm flex-1">{sector.name}</span>
                        <span className="text-sm font-medium">${sector.value.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Your portfolio diversity will appear here once you start trading
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Section - Side by Side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* AI Portfolio Health */}
          <PortfolioHealthAI
            holdings={holdings || []}
            cashBalance={portfolioStats?.cashBalance || 0}
            totalValue={portfolioStats?.totalValue || 0}
            startingBalance={startingBalance}
          />

          {/* AI Assistant - Prominent */}
          <AIAssistantCard 
            title="Ask AI About Your Portfolio"
            description="Get personalized investing advice"
            suggestedQuestions={[
              "How can I improve my portfolio?",
              "Should I buy more stocks or diversify?",
              "What stocks should beginners avoid?"
            ]}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
