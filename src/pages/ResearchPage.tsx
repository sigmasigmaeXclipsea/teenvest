import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Building2, BarChart3, Calendar, Brain, GitCompare, ChevronRight, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCachedStocks, useRefreshStockCache, isCacheStale } from '@/hooks/useStockCache';
import { useStockQuote } from '@/hooks/useStockAPI';
import ResearchCompanyProfile from '@/components/research/ResearchCompanyProfile';
import ResearchFinancials from '@/components/research/ResearchFinancials';
import ResearchKeyStats from '@/components/research/ResearchKeyStats';
import ResearchAnalystRatings from '@/components/research/ResearchAnalystRatings';
import ResearchEarningsCalendar from '@/components/research/ResearchEarningsCalendar';
import ResearchTechnicalIndicators from '@/components/research/ResearchTechnicalIndicators';
import ResearchAIAssistant from '@/components/research/ResearchAIAssistant';
import ResearchComparison from '@/components/research/ResearchComparison';
import StockCandlestickChart from '@/components/StockCandlestickChart';
import StockLineChart from '@/components/StockLineChart';
import ProfessionalCandlestickChart from '@/components/ProfessionalCandlestickChart';

const ResearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const symbolFromUrl = searchParams.get('symbol') || '';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<string | null>(symbolFromUrl || null);
  const [activeTab, setActiveTab] = useState('charts'); // Default to charts tab
  const { data: cachedStocks, isLoading } = useCachedStocks();
  
  // Update selectedStock when URL param changes
  useEffect(() => {
    if (symbolFromUrl && symbolFromUrl !== selectedStock) {
      setSelectedStock(symbolFromUrl);
      setActiveTab('charts'); // Default to charts
    }
  }, [symbolFromUrl]);
  
  // Fetch live stock data for candlestick chart
  const { data: liveStockData } = useStockQuote(selectedStock || '');

  // Filter stocks based on search
  const filteredStocks = cachedStocks?.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8) || [];


  const handleStockSelect = (symbol: string) => {
    setSelectedStock(symbol);
    setSearchQuery('');
    setActiveTab('charts'); // Default to charts tab
    // Update URL with symbol
    setSearchParams({ symbol });
  };

  const selectedStockData = cachedStocks?.find(s => s.symbol === selectedStock);

  // If no stock selected, show search interface
  if (!selectedStock) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Stock Research</h1>
              <p className="text-muted-foreground">Search for a stock to view detailed analysis and charts</p>
            </div>
          </div>

          {/* Search Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Search for a Stock</CardTitle>
              <CardDescription>Enter a stock symbol or company name to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search stocks by symbol or name (e.g., AAPL, Apple)"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredStocks.length > 0) {
                      handleStockSelect(filteredStocks[0].symbol);
                    }
                  }}
                />
                
                {/* Search Dropdown */}
                {searchQuery && filteredStocks.length > 0 && (
                  <Card className="absolute top-full mt-2 w-full z-50 shadow-lg">
                    <div className="py-2 max-h-96 overflow-y-auto">
                      {filteredStocks.map((stock) => (
                        <button
                          key={stock.symbol}
                          onClick={() => handleStockSelect(stock.symbol)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono">{stock.symbol}</Badge>
                            <div className="text-left">
                              <span className="text-sm font-medium block">{stock.company_name}</span>
                              <span className="text-xs text-muted-foreground">{stock.sector || 'N/A'}</span>
                            </div>
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

              {/* Popular Stocks Quick Access */}
              {!searchQuery && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-3">Popular Stocks</h3>
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Access Tools */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-colors active:scale-95" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate('/screener');
              }}
            >
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

            <Card 
              className="cursor-pointer hover:border-primary/50 transition-colors active:scale-95"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const firstStock = cachedStocks?.[0];
                if (firstStock) {
                  handleStockSelect(firstStock.symbol);
                  setTimeout(() => setActiveTab('compare'), 100);
                } else {
                  navigate('/screener');
                }
              }}
            >
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

            <Card 
              className="cursor-pointer hover:border-primary/50 transition-colors active:scale-95"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const firstStock = cachedStocks?.[0];
                if (firstStock) {
                  handleStockSelect(firstStock.symbol);
                  setTimeout(() => setActiveTab('earnings'), 100);
                } else {
                  navigate('/screener');
                }
              }}
            >
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

            <Card 
              className="cursor-pointer hover:border-primary/50 transition-colors active:scale-95"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const firstStock = cachedStocks?.[0];
                if (firstStock) {
                  handleStockSelect(firstStock.symbol);
                  setTimeout(() => setActiveTab('ai'), 100);
                } else {
                  navigate('/screener');
                }
              }}
            >
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
        </div>
      </DashboardLayout>
    );
  }

  // Stock detail view
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => {
              setSelectedStock(null);
              setSearchParams({});
            }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Stock Research</h1>
              <p className="text-muted-foreground">Deep dive into {selectedStock} with professional-grade tools</p>
            </div>
          </div>
          
          {/* Stock Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for another stock..."
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

        {/* Main Content - Always show stock details */}
        {selectedStock && (
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
                      <p className="text-muted-foreground">{selectedStockData?.company_name || liveStockData?.companyName || selectedStock || 'Loading...'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-3xl font-bold">
                        ${(selectedStockData?.price ?? liveStockData?.price ?? 0).toFixed(2)}
                      </p>
                      <p className={`text-sm font-medium ${((selectedStockData?.change_percent ?? liveStockData?.changePercent ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500')}`}>
                        {((selectedStockData?.change_percent ?? liveStockData?.changePercent ?? 0) >= 0 ? '+' : '')}
                        ${(selectedStockData?.change ?? liveStockData?.change ?? 0).toFixed(2)} ({(selectedStockData?.change_percent ?? liveStockData?.changePercent ?? 0).toFixed(2)}%)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => navigate(`/trade?symbol=${selectedStock}`)}>
                        Trade
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Research Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-4 lg:grid-cols-9 w-full">
                <TabsTrigger value="charts">Charts</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="statistics">Statistics</TabsTrigger>
                <TabsTrigger value="analysts">Analysts</TabsTrigger>
                <TabsTrigger value="earnings">Earnings</TabsTrigger>
                <TabsTrigger value="technicals">Technicals</TabsTrigger>
                <TabsTrigger value="compare">Compare</TabsTrigger>
                <TabsTrigger value="ai">AI Research</TabsTrigger>
              </TabsList>

              <TabsContent value="charts">
                <div className="space-y-6">
                  {/* Top: Line and Candlestick Charts */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {(() => {
                      const stockData = liveStockData || (selectedStockData ? {
                        symbol: selectedStock,
                        price: selectedStockData.price ?? 0,
                        previousClose: (selectedStockData.price ?? 0) - (selectedStockData.change ?? 0),
                        high: selectedStockData.high ?? (selectedStockData.price ?? 0) * 1.02,
                        low: selectedStockData.low ?? (selectedStockData.price ?? 0) * 0.98,
                        open: (selectedStockData.price ?? 0) - (selectedStockData.change ?? 0),
                      } : null);

                      if (!stockData || !stockData.symbol) {
                        return (
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-muted-foreground">Loading chart data...</p>
                            </CardContent>
                          </Card>
                        );
                      }

                      return (
                        <>
                          <StockLineChart
                            symbol={stockData.symbol}
                            currentPrice={stockData.price || 0}
                            previousClose={stockData.previousClose || stockData.price || 0}
                            high={stockData.high || stockData.price * 1.02 || 0}
                            low={stockData.low || stockData.price * 0.98 || 0}
                            open={stockData.open || stockData.price || 0}
                          />
                          <StockCandlestickChart
                            symbol={stockData.symbol}
                            currentPrice={stockData.price || 0}
                            previousClose={stockData.previousClose || stockData.price || 0}
                            high={stockData.high || stockData.price * 1.02 || 0}
                            low={stockData.low || stockData.price * 0.98 || 0}
                            open={stockData.open || stockData.price || 0}
                          />
                        </>
                      );
                    })()}
                  </div>

                  {/* Bottom: Professional Full-Width Candlestick Chart with Volume */}
                  {(() => {
                    const stockData = liveStockData || (selectedStockData ? {
                      symbol: selectedStock,
                      price: selectedStockData.price ?? 0,
                      previousClose: (selectedStockData.price ?? 0) - (selectedStockData.change ?? 0),
                      high: selectedStockData.high ?? (selectedStockData.price ?? 0) * 1.02,
                      low: selectedStockData.low ?? (selectedStockData.price ?? 0) * 0.98,
                      open: (selectedStockData.price ?? 0) - (selectedStockData.change ?? 0),
                    } : null);

                    if (!stockData || !stockData.symbol) return null;

                    return (
                      <ProfessionalCandlestickChart
                        symbol={stockData.symbol}
                        currentPrice={stockData.price || 0}
                        previousClose={stockData.previousClose || stockData.price || 0}
                        high={stockData.high || stockData.price * 1.02 || 0}
                        low={stockData.low || stockData.price * 0.98 || 0}
                        open={stockData.open || stockData.price || 0}
                      />
                    );
                  })()}
                </div>
              </TabsContent>

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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ResearchPage;