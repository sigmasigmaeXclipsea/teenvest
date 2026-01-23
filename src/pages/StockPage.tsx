import { useParams, Link } from 'react-router-dom';
import { useState, useMemo, lazy, Suspense } from 'react';
import { TrendingUp, TrendingDown, ExternalLink, ArrowLeft, Star, StarOff, Loader2, Globe, Building2, Calendar, DollarSign, Activity, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useStockQuote } from '@/hooks/useStockAPI';
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '@/hooks/useWatchlist';
import { usePortfolio, useHoldings, useExecuteTrade } from '@/hooks/usePortfolio';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorMessages';
import { formatMarketCap, formatVolume } from '@/data/mockStocks';
import StockLineChart from '@/components/StockLineChart';
import StockCandlestickChart from '@/components/StockCandlestickChart';
// Lazy load StockNews - it's heavy with API calls
const StockNews = lazy(() => import('@/components/StockNews'));
import { useSettings } from '@/contexts/SettingsContext';

const StockPage = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { data: stock, isLoading, error } = useStockQuote(symbol || '');
  const { data: watchlist } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const { toast } = useToast();
  const { settings } = useSettings();
  const { data: portfolio } = usePortfolio();
  const { data: holdings } = useHoldings();
  const executeTrade = useExecuteTrade();

  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [shares, setShares] = useState('');

  const isAdvancedMode = settings.advancedMode;

  const isInWatchlist = watchlist?.some(w => w.symbol === symbol);

  const currentHolding = useMemo(() => {
    return holdings?.find(h => h.symbol === symbol);
  }, [holdings, symbol]);

  const totalCost = useMemo(() => {
    if (!stock || !shares) return 0;
    return Number(shares) * stock.price;
  }, [stock, shares]);

  const handleTrade = async () => {
    if (!stock || !shares || Number(shares) <= 0) {
      toast({ title: 'Invalid trade', description: 'Please enter a valid number of shares', variant: 'destructive' });
      return;
    }

    try {
      await executeTrade.mutateAsync({
        symbol: stock.symbol,
        companyName: stock.companyName,
        tradeType,
        orderType,
        shares: Number(shares),
        price: stock.price,
        sector: stock.sector,
      });
      toast({ title: 'Trade executed!', description: `${tradeType === 'buy' ? 'Bought' : 'Sold'} ${shares} shares of ${stock.symbol}` });
      setShares('');
    } catch (error: any) {
      toast({ title: 'Trade failed', description: getUserFriendlyError(error), variant: 'destructive' });
    }
  };

  const handleToggleWatchlist = async () => {
    if (!stock) return;
    try {
      if (isInWatchlist) {
        await removeFromWatchlist.mutateAsync(stock.symbol);
        toast({ title: 'Removed from watchlist' });
      } else {
        await addToWatchlist.mutateAsync({ symbol: stock.symbol, companyName: stock.companyName });
        toast({ title: 'Added to watchlist' });
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !stock) {
    // Redirect to research page instead of showing error
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-2">Stock Not Found</h2>
          <p className="text-muted-foreground mb-4">Could not find data for "{symbol}"</p>
          <div className="flex gap-2 justify-center">
            <Link to={`/research?symbol=${symbol}`}>
              <Button>Try Research Page</Button>
            </Link>
            <Link to="/screener">
              <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Screener</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isPositive = stock.change >= 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link to="/screener">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border">
              <span className="text-lg font-bold text-primary">{stock.symbol.slice(0, 2)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{stock.symbol}</h1>
                <Badge variant="outline">{stock.sector || 'N/A'}</Badge>
              </div>
              <p className="text-muted-foreground">{stock.companyName}</p>
              {stock.exchange && <p className="text-xs text-muted-foreground">{stock.exchange}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleToggleWatchlist}>
              {isInWatchlist ? <Star className="w-4 h-4 fill-primary text-primary mr-2" /> : <StarOff className="w-4 h-4 mr-2" />}
              {isInWatchlist ? 'Watching' : 'Watch'}
            </Button>
          </div>
        </div>

        {/* Price Card */}
        <Card className="bg-gradient-to-br from-card to-secondary/20">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Price</p>
                <p className="text-5xl font-bold">${stock.price.toFixed(2)}</p>
              </div>
              <div className={`flex items-center gap-2 text-lg font-semibold ${isPositive ? 'text-primary' : 'text-destructive'}`}>
                {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <span>{isPositive ? '+' : ''}{stock.change.toFixed(2)}</span>
                <span>({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <StockLineChart 
            symbol={stock.symbol}
            currentPrice={stock.price}
            previousClose={stock.previousClose}
            high={stock.high}
            low={stock.low}
            open={stock.open}
          />
          
          <StockCandlestickChart 
            symbol={stock.symbol}
            currentPrice={stock.price}
            previousClose={stock.previousClose}
            high={stock.high}
            low={stock.low}
            open={stock.open}
          />
        </div>

        {/* News Section - Lazy loaded */}
        <Suspense fallback={<Card><CardContent className="pt-6"><Skeleton className="h-64" /></CardContent></Card>}>
          <StockNews symbol={stock.symbol} companyName={stock.companyName} />
        </Suspense>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> Day Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm">
                <span>Low: <strong>${stock.low.toFixed(2)}</strong></span>
                <span>High: <strong>${stock.high.toFixed(2)}</strong></span>
              </div>
              <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ 
                    width: stock.high > stock.low 
                      ? `${((stock.price - stock.low) / (stock.high - stock.low)) * 100}%` 
                      : '50%' 
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Previous Close
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${stock.previousClose.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Open: ${stock.open.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> Market Cap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stock.marketCap ? formatMarketCap(stock.marketCap) : '—'}</p>
              {stock.shareOutstanding && stock.shareOutstanding > 0 && (
                <p className="text-xs text-muted-foreground">
                  {(stock.shareOutstanding).toFixed(2)}M shares
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stock.volume ? formatVolume(stock.volume) : '—'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Company Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stock.sector && (
                <div>
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-medium">{stock.sector}</p>
                </div>
              )}
              {stock.country && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Country
                  </p>
                  <p className="font-medium">{stock.country}</p>
                </div>
              )}
              {stock.ipo && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> IPO Date
                  </p>
                  <p className="font-medium">{stock.ipo}</p>
                </div>
              )}
              {stock.weburl && (
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  <a 
                    href={stock.weburl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    Visit <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trading Interface */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Trade {stock.symbol}</CardTitle>
            <CardDescription>
              Cash available: ${Number(portfolio?.cash_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              {currentHolding && (
                <span className="ml-4">• You own: {Number(currentHolding.shares).toFixed(2)} shares</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as 'buy' | 'sell')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">Buy</TabsTrigger>
                <TabsTrigger value="sell" disabled={!currentHolding || Number(currentHolding.shares) <= 0}>
                  Sell
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-4">
              <div>
                <Label htmlFor="order-type">Order Type</Label>
                <Select value={orderType} onValueChange={(v) => setOrderType(v as 'market' | 'limit' | 'stop')}>
                  <SelectTrigger id="order-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                    <SelectItem value="stop">Stop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="shares">Shares</Label>
                <Input
                  id="shares"
                  type="number"
                  placeholder="0"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              {shares && Number(shares) > 0 && stock && (
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Price per share:</span>
                    <span className="font-semibold">${stock.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Shares:</span>
                    <span className="font-semibold">{Number(shares).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total Cost:</span>
                    <span className={tradeType === 'buy' && totalCost > Number(portfolio?.cash_balance || 0) ? 'text-destructive' : ''}>
                      ${totalCost.toFixed(2)}
                    </span>
                  </div>
                  {tradeType === 'buy' && totalCost > Number(portfolio?.cash_balance || 0) && (
                    <p className="text-xs text-destructive mt-2">Insufficient funds</p>
                  )}
                  {tradeType === 'sell' && currentHolding && Number(shares) > Number(currentHolding.shares) && (
                    <p className="text-xs text-destructive mt-2">Insufficient shares</p>
                  )}
                </div>
              )}

              <Button
                onClick={handleTrade}
                disabled={executeTrade.isPending || !shares || Number(shares) <= 0 || (tradeType === 'buy' && totalCost > Number(portfolio?.cash_balance || 0)) || (tradeType === 'sell' && currentHolding && Number(shares) > Number(currentHolding.shares))}
                className="w-full"
                size="lg"
              >
                {executeTrade.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {tradeType === 'buy' ? <TrendingUp className="w-4 h-4 mr-2" /> : <TrendingDown className="w-4 h-4 mr-2" />}
                    {tradeType === 'buy' ? 'Buy' : 'Sell'} {stock.symbol}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StockPage;
