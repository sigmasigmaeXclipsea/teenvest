import { useParams, Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ExternalLink, ArrowLeft, Star, StarOff, Loader2, Globe, Building2, Calendar, DollarSign, BarChart3, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useStockQuote } from '@/hooks/useStockAPI';
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '@/hooks/useWatchlist';
import { useToast } from '@/hooks/use-toast';
import { formatMarketCap, formatVolume } from '@/data/mockStocks';

const StockPage = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { data: stock, isLoading, error } = useStockQuote(symbol || '');
  const { data: watchlist } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const { toast } = useToast();

  const isInWatchlist = watchlist?.some(w => w.symbol === symbol);

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
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-2">Stock Not Found</h2>
          <p className="text-muted-foreground mb-4">Could not find data for "{symbol}"</p>
          <Link to="/screener">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Screener</Button>
          </Link>
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
            {stock.logo && (
              <img 
                src={stock.logo} 
                alt={stock.companyName} 
                className="w-14 h-14 rounded-lg object-contain bg-background border p-1"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
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
            <Link to={`/trade?symbol=${stock.symbol}`}>
              <Button>Trade {stock.symbol}</Button>
            </Link>
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
                <BarChart3 className="w-4 h-4" /> Market Cap
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

        {/* Trade CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Ready to trade {stock.symbol}?</h3>
              <p className="text-muted-foreground">Execute market or limit orders with your paper trading account.</p>
            </div>
            <Link to={`/trade?symbol=${stock.symbol}`}>
              <Button size="lg" className="gap-2">
                <TrendingUp className="w-4 h-4" /> Trade Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StockPage;
