import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Building2, BarChart3, Calendar, Brain, GitCompare, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useCachedStocks, useRefreshStockCache, isCacheStale } from '@/hooks/useStockCache';
import ResearchCompanyProfile from '@/components/research/ResearchCompanyProfile';
import ResearchFinancials from '@/components/research/ResearchFinancials';
import ResearchKeyStats from '@/components/research/ResearchKeyStats';
import ResearchAnalystRatings from '@/components/research/ResearchAnalystRatings';
import ResearchEarningsCalendar from '@/components/research/ResearchEarningsCalendar';
import ResearchTechnicalIndicators from '@/components/research/ResearchTechnicalIndicators';
import ResearchAIAssistant from '@/components/research/ResearchAIAssistant';
import ResearchComparison from '@/components/research/ResearchComparison';

const ResearchPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const { data: cachedStocks, isLoading } = useCachedStocks();

  // Filter stocks based on search
  const filteredStocks = cachedStocks?.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8) || [];

  // Get top movers for the dashboard
  const topGainers = [...(cachedStocks || [])].sort((a, b) => b.change_percent - a.change_percent).slice(0, 5);
  const topLosers = [...(cachedStocks || [])].sort((a, b) => a.change_percent - b.change_percent).slice(0, 5);

  const handleStockSelect = (symbol: string) => {
    setSelectedStock(symbol);
    setSearchQuery('');
  };

  const selectedStockData = cachedStocks?.find(s => s.symbol === selectedStock);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Research Hub</h1>
            <p className="text-muted-foreground">Deep dive into stocks with professional-grade tools</p>
          </div>
          
          {/* Stock Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search stocks by symbol or name..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {/* Search Dropdown */}
            {searchQuery && filteredStocks.length > 0 && (
              <Card className="absolute top-full mt-1 w-full z-50 shadow-lg">
                <div className="py-2">
                  {filteredStocks.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleStockSelect(stock.symbol)}
                      className="w-full px-4 py-2 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">{stock.symbol}</Badge>
                        <span className="text-sm truncate">{stock.company_name}</span>
                      </div>
                      <div className={`text-sm font-medium ${stock.change_percent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Main Content */}
        {selectedStock ? (
          /* Stock Research View */
          <div className="space-y-6">
            {/* Stock Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold">{selectedStock}</h2>
                        {selectedStockData?.sector && (
                          <Badge variant="secondary">{selectedStockData.sector}</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{selectedStockData?.company_name || 'Loading...'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-3xl font-bold">${selectedStockData?.price.toFixed(2) || '--'}</p>
                      <p className={`text-sm font-medium ${(selectedStockData?.change_percent || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {(selectedStockData?.change_percent || 0) >= 0 ? '+' : ''}
                        ${selectedStockData?.change.toFixed(2) || '0.00'} ({selectedStockData?.change_percent.toFixed(2) || '0.00'}%)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => navigate(`/stocks/${selectedStock}`)}>
                        View Charts
                      </Button>
                      <Button variant="outline" onClick={() => navigate(`/trade?symbol=${selectedStock}`)}>
                        Trade
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Research Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="statistics">Statistics</TabsTrigger>
                <TabsTrigger value="analysts">Analysts</TabsTrigger>
                <TabsTrigger value="earnings">Earnings</TabsTrigger>
                <TabsTrigger value="technicals">Technicals</TabsTrigger>
                <TabsTrigger value="compare">Compare</TabsTrigger>
                <TabsTrigger value="ai">AI Research</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <ResearchCompanyProfile symbol={selectedStock} />
              </TabsContent>

              <TabsContent value="financials">
                <ResearchFinancials symbol={selectedStock} />
              </TabsContent>

              <TabsContent value="statistics">
                <ResearchKeyStats symbol={selectedStock} stockData={selectedStockData} />
              </TabsContent>

              <TabsContent value="analysts">
                <ResearchAnalystRatings symbol={selectedStock} />
              </TabsContent>

              <TabsContent value="earnings">
                <ResearchEarningsCalendar symbol={selectedStock} />
              </TabsContent>

              <TabsContent value="technicals">
                <ResearchTechnicalIndicators symbol={selectedStock} />
              </TabsContent>

              <TabsContent value="compare">
                <ResearchComparison primarySymbol={selectedStock} cachedStocks={cachedStocks || []} />
              </TabsContent>

              <TabsContent value="ai">
                <ResearchAIAssistant symbol={selectedStock} />
              </TabsContent>
            </Tabs>

            {/* Back to Dashboard */}
            <Button variant="ghost" onClick={() => setSelectedStock(null)}>
              ← Back to Research Dashboard
            </Button>
          </div>
        ) : (
          /* Dashboard Overview */
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Quick Research Cards */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Market Overview
                </CardTitle>
                <CardDescription>Today's market movers and trending stocks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Top Gainers */}
                  <div>
                    <h3 className="font-semibold text-emerald-500 flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4" /> Top Gainers
                    </h3>
                    {isLoading ? (
                      <div className="space-y-2">
                        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {topGainers.map(stock => (
                          <button
                            key={stock.symbol}
                            onClick={() => handleStockSelect(stock.symbol)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">{stock.symbol}</Badge>
                              <span className="text-sm text-muted-foreground truncate max-w-[120px]">{stock.company_name}</span>
                            </div>
                            <span className="text-emerald-500 font-medium">+{stock.change_percent.toFixed(2)}%</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Top Losers */}
                  <div>
                    <h3 className="font-semibold text-red-500 flex items-center gap-2 mb-3">
                      <TrendingDown className="w-4 h-4" /> Top Losers
                    </h3>
                    {isLoading ? (
                      <div className="space-y-2">
                        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {topLosers.map(stock => (
                          <button
                            key={stock.symbol}
                            onClick={() => handleStockSelect(stock.symbol)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">{stock.symbol}</Badge>
                              <span className="text-sm text-muted-foreground truncate max-w-[120px]">{stock.company_name}</span>
                            </div>
                            <span className="text-red-500 font-medium">{stock.change_percent.toFixed(2)}%</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Access */}
            <div className="space-y-4">
              <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/screener')}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Stock Screener</h3>
                        <p className="text-sm text-muted-foreground">Filter by criteria</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <GitCompare className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Compare Stocks</h3>
                        <p className="text-sm text-muted-foreground">Side-by-side analysis</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Earnings Calendar</h3>
                        <p className="text-sm text-muted-foreground">Upcoming reports</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">AI Research Assistant</h3>
                        <p className="text-sm text-muted-foreground">Ask anything</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Popular Stocks Grid */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Popular Stocks</CardTitle>
                <CardDescription>Click on any stock to start researching</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => <Skeleton key={i} className="h-20" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {cachedStocks?.slice(0, 12).map(stock => (
                      <button
                        key={stock.symbol}
                        onClick={() => handleStockSelect(stock.symbol)}
                        className="p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/30 transition-colors text-left"
                      >
                        <p className="font-bold">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate">{stock.company_name}</p>
                        <p className={`text-sm font-medium mt-1 ${stock.change_percent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ResearchPage;