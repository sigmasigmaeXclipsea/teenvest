import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowUpDown, TrendingUp, TrendingDown, Search, Loader2, ExternalLink, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Stock } from '@/data/mockStocks';
import { russell5000Tickers, searchTickers, getTickerInfo, getTotalTickerCount } from '@/data/russell5000Tickers';
import { usePortfolio, useHoldings, useExecuteTrade } from '@/hooks/usePortfolio';
import { useToast } from '@/hooks/use-toast';
import { useStockQuote, useSearchStock, StockQuote } from '@/hooks/useStockAPI';
import { getUserFriendlyError } from '@/lib/errorMessages';
import StockLineChart from '@/components/StockLineChart';
import StockCandlestickChart from '@/components/StockCandlestickChart';

const TradePage = () => {
  const [searchParams] = useSearchParams();
  const initialSymbol = searchParams.get('symbol') || '';
  const navigate = useNavigate();
  
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [tickerSearch, setTickerSearch] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [shares, setShares] = useState('');
  const [liveStockData, setLiveStockData] = useState<StockQuote | null>(null);
  
  const { data: portfolio } = usePortfolio();
  const { data: holdings } = useHoldings();
  const executeTrade = useExecuteTrade();
  const { toast } = useToast();
  const searchStock = useSearchStock();
  
  // Fetch live data for selected symbol
  const { data: liveQuote, isLoading: isLoadingQuote } = useStockQuote(selectedSymbol);
  
  // Update live stock data when quote changes
  useEffect(() => {
    if (liveQuote) {
      setLiveStockData(liveQuote);
    }
  }, [liveQuote]);

  const handleTickerSearch = async () => {
    if (!tickerSearch.trim()) return;
    
    const ticker = tickerSearch.trim().toUpperCase();
    
    try {
      const result = await searchStock.mutateAsync(ticker);
      setSelectedSymbol(result.symbol);
      setLiveStockData(result);
      setTickerSearch('');
      toast({ 
        title: 'Stock found!', 
        description: `Loaded ${result.companyName} (${result.symbol})` 
      });
    } catch (error) {
      toast({ 
        title: 'Stock not found', 
        description: `Could not find ticker "${ticker}"`, 
        variant: 'destructive' 
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTickerSearch();
    }
  };

  // Use live data from either the quote hook or search mutation
  const tickerInfo = getTickerInfo(selectedSymbol);
  const currentQuote = liveStockData || liveQuote;
  const selectedStock: Stock | null = currentQuote ? {
    symbol: currentQuote.symbol,
    companyName: currentQuote.companyName,
    price: currentQuote.price ?? 0,
    change: currentQuote.change ?? 0,
    changePercent: currentQuote.changePercent ?? 0,
    volume: currentQuote.volume || 0,
    marketCap: currentQuote.marketCap || 0,
    sector: currentQuote.sector || tickerInfo?.sector || 'Unknown',
    riskLevel: currentQuote.riskLevel || 'medium',
    high52Week: currentQuote.high ?? 0,
    low52Week: currentQuote.low ?? 0,
  } : null;
  
  const totalCost = selectedStock ? Number(shares) * selectedStock.price : 0;
  const currentHolding = holdings?.find(h => h.symbol === selectedSymbol);

  const handleTrade = async () => {
    if (!selectedStock || !shares || Number(shares) <= 0) {
      toast({ title: 'Invalid trade', description: 'Please select a stock and enter shares', variant: 'destructive' });
      return;
    }

    try {
      await executeTrade.mutateAsync({
        symbol: selectedStock.symbol,
        companyName: selectedStock.companyName,
        tradeType,
        orderType,
        shares: Number(shares),
        price: selectedStock.price,
        sector: selectedStock.sector,
      });
      toast({ title: 'Trade executed!', description: `${tradeType === 'buy' ? 'Bought' : 'Sold'} ${shares} shares of ${selectedStock.symbol}` });
      setShares('');
    } catch (error: any) {
      toast({ title: 'Trade failed', description: getUserFriendlyError(error), variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Trade</h1>
          <p className="text-muted-foreground">Buy and sell stocks with virtual money</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Stock Selection & Info */}
          <Card>
            <CardHeader>
              <CardTitle>Select Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ticker Search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Enter any ticker (e.g., AAPL, TSLA)..." 
                    value={tickerSearch}
                    onChange={(e) => setTickerSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10" 
                  />
                </div>
                <Button 
                  variant="secondary"
                  onClick={handleTickerSearch}
                  disabled={searchStock.isPending || !tickerSearch.trim()}
                >
                  {searchStock.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>

              {/* Search suggestions */}
              {tickerSearch && !searchStock.isPending && (
                <div className="border rounded-lg bg-background max-h-48 overflow-y-auto">
                  <p className="text-xs text-muted-foreground p-2 border-b">
                    {getTotalTickerCount()} Russell stocks available - showing matches:
                  </p>
                  {searchTickers(tickerSearch, 10).map(t => (
                    <button
                      key={t.symbol}
                      className="w-full text-left px-3 py-2 hover:bg-secondary text-sm flex justify-between items-center"
                      onClick={() => {
                        navigate(`/stocks/${t.symbol}`);
                      }}
                    >
                      <span><strong>{t.symbol}</strong> - {t.name}</span>
                      <span className="text-xs text-muted-foreground">{t.sector}</span>
                    </button>
                  ))}
                </div>
              )}

              {isLoadingQuote && selectedSymbol && (
                <div className="p-4 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading live data...</span>
                </div>
              )}

              {selectedStock && !isLoadingQuote && (
                <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-2xl font-bold">{selectedStock.symbol}</p>
                      <p className="text-sm text-muted-foreground">{selectedStock.companyName}</p>
                      {liveStockData && (
                        <p className="text-xs text-primary">Live data</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${Number(selectedStock.price).toFixed(2)}</p>
                      <p className={`text-sm flex items-center justify-end gap-1 ${selectedStock.change >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {selectedStock.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Number(selectedStock.changePercent).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Day High:</span> ${Number(selectedStock.high52Week).toFixed(2)}</div>
                    <div><span className="text-muted-foreground">Day Low:</span> ${Number(selectedStock.low52Week).toFixed(2)}</div>
                    <div><span className="text-muted-foreground">Sector:</span> {selectedStock.sector}</div>
                    <div><span className="text-muted-foreground">Risk:</span> {selectedStock.riskLevel}</div>
                  </div>
                  {currentHolding && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">You own: <span className="font-medium text-foreground">{Number(currentHolding.shares).toFixed(2)} shares</span></p>
                    </div>
                  )}
                  <Link to={`/stocks/${selectedStock.symbol}`}>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Full Stock Details & Charts
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Form */}
          <Card>
            <CardHeader>
              <CardTitle>Place Order</CardTitle>
              <CardDescription>Cash available: ${Number(portfolio?.cash_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as 'buy' | 'sell')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy">Buy</TabsTrigger>
                  <TabsTrigger value="sell">Sell</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <Label>Order Type</Label>
                <Select value={orderType} onValueChange={(v) => setOrderType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market Order</SelectItem>
                    <SelectItem value="limit">Limit Order</SelectItem>
                    <SelectItem value="stop">Stop Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Number of Shares</Label>
                <Input type="number" value={shares} onChange={(e) => setShares(e.target.value)} placeholder="0" min="0" step="1" />
              </div>

              {selectedStock && shares && (
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated {tradeType === 'buy' ? 'Cost' : 'Value'}</span>
                    <span className="font-bold">${totalCost.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleTrade} 
                disabled={!selectedStock || !shares || executeTrade.isPending}
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                {executeTrade.isPending ? 'Processing...' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${selectedStock?.symbol || 'Stock'}`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stock Charts - Shown when stock is selected */}
        {selectedStock && liveQuote && (
          <div className="grid gap-6 lg:grid-cols-2">
            <StockLineChart 
              symbol={selectedStock.symbol}
              currentPrice={selectedStock.price}
              previousClose={liveQuote.previousClose}
              high={liveQuote.high}
              low={liveQuote.low}
              open={liveQuote.open}
            />
            <StockCandlestickChart
              symbol={selectedStock.symbol}
              currentPrice={selectedStock.price}
              previousClose={liveQuote.previousClose}
              high={liveQuote.high}
              low={liveQuote.low}
              open={liveQuote.open}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TradePage;
