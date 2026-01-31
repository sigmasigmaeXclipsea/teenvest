import { useParams, Link } from 'react-router-dom';
import { useState, useMemo, lazy, Suspense } from 'react';
import { TrendingUp, TrendingDown, ExternalLink, ArrowLeft, Star, StarOff, Loader2, Globe, Building2, Calendar, DollarSign, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ToastAction } from '@/components/ui/toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useStockQuote } from '@/hooks/useStockAPI';
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '@/hooks/useWatchlist';
import { usePortfolio, useHoldings, useExecuteTrade } from '@/hooks/usePortfolio';
import { usePlaceOrder } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { useLearningModules, useUserProgress } from '@/hooks/useLearning';
import { getUserFriendlyError } from '@/lib/errorMessages';
import { formatMarketCap, formatVolume } from '@/data/mockStocks';
import StockLineChart from '@/components/StockLineChart';
import ProfessionalCandlestickChart from '@/components/ProfessionalCandlestickChart';
import { useSkillTreeProgress } from '@/hooks/useSkillTreeProgress';
import { getLessonByTitle } from '@/lib/learning';
import {
  predictionIndicatorOptions,
  predictionHorizonOptions,
  getPredictionHorizonAt,
  type PredictionDirection,
} from '@/lib/tradePredictions';
// Lazy load StockNews - it's heavy with API calls
const StockNews = lazy(() => import('@/components/StockNews'));

const StockPage = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { data: stock, isLoading, error } = useStockQuote(symbol || '');
  const { data: watchlist } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const { toast } = useToast();
  const { data: portfolio } = usePortfolio();
  const { data: holdings } = useHoldings();
  const executeTrade = useExecuteTrade();
  const placeOrder = usePlaceOrder();
  const { unlocks } = useSkillTreeProgress();
  const { data: modules } = useLearningModules();
  const { data: progress } = useUserProgress();

  const shortLesson = useMemo(() => getLessonByTitle(modules, 'Short Selling Risks'), [modules]);
  const shortLessonCompleted = useMemo(() => {
    if (!shortLesson) return false;
    return (progress || []).some((entry) => entry.module_id === shortLesson.id && entry.completed);
  }, [progress, shortLesson]);
  const shouldWarnShorting = useMemo(
    () => !shortLessonCompleted && !unlocks.riskManager,
    [shortLessonCompleted, unlocks.riskManager]
  );
  const [hasWarnedShorting, setHasWarnedShorting] = useState(false);

  const [tradeType, setTradeType] = useState<'buy' | 'sell' | 'short' | 'cover'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [shares, setShares] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [predictionDirection, setPredictionDirection] = useState<PredictionDirection>('up');
  const [predictionThesis, setPredictionThesis] = useState('');
  const [predictionIndicators, setPredictionIndicators] = useState<string[]>([]);
  const [predictionTarget, setPredictionTarget] = useState('');
  const [predictionHorizon, setPredictionHorizon] = useState('1d');

  const isInWatchlist = watchlist?.some(w => w.symbol === symbol);

  const currentHolding = useMemo(() => {
    return holdings?.find(h => h.symbol === symbol);
  }, [holdings, symbol]);

  const shortLessonHref = shortLesson ? `/learn/${shortLesson.id}` : '/learn';

  const handleTradeTypeChange = (value: 'buy' | 'sell' | 'short' | 'cover') => {
    setTradeType(value);
    if (value === 'short' && shouldWarnShorting && !hasWarnedShorting) {
      setHasWarnedShorting(true);
      toast({
        title: 'You have not learned this yet',
        description: 'Learn shorting in 3 minutes?',
        duration: Number.POSITIVE_INFINITY,
        action: (
          <ToastAction altText="Learn shorting" asChild>
            <a href={shortLessonHref}>Open lesson</a>
          </ToastAction>
        ),
      });
    }
  };

  const orderPrice = useMemo(() => {
    if (!stock) return 0;
    if (orderType === 'limit') return Number(limitPrice) || 0;
    if (orderType === 'stop') return Number(stopPrice) || 0;
    return stock.price;
  }, [stock, orderType, limitPrice, stopPrice]);

  const totalCost = useMemo(() => {
    if (!stock || !shares) return 0;
    return Number(shares) * (orderPrice || stock.price);
  }, [stock, shares, orderPrice]);

  const tradeVerb = useMemo(() => {
    if (tradeType === 'buy') return 'Bought';
    if (tradeType === 'sell') return 'Sold';
    if (tradeType === 'short') return 'Shorted';
    return 'Covered';
  }, [tradeType]);

  const tradeActionLabel = useMemo(() => {
    if (tradeType === 'buy') return 'Buy';
    if (tradeType === 'sell') return 'Sell';
    if (tradeType === 'short') return 'Short';
    return 'Cover';
  }, [tradeType]);

  const estimateLabel = useMemo(() => {
    if (tradeType === 'buy' || tradeType === 'cover') return 'Cost';
    return 'Proceeds';
  }, [tradeType]);

  const isBuyAction = useMemo(
    () => tradeType === 'buy' || tradeType === 'cover',
    [tradeType]
  );

  const isPredictionValid = predictionThesis.trim().length >= 6;
  const isOrderPriceValid =
    orderType === 'market' ||
    (orderType === 'limit' ? Number(limitPrice) > 0 : Number(stopPrice) > 0);
  const isSubmitting = executeTrade.isPending || placeOrder.isPending;

  const handleTrade = async () => {
    if (!stock || !shares || Number(shares) <= 0) {
      toast({ title: 'Invalid trade', description: 'Please enter a valid number of shares', variant: 'destructive' });
      return;
    }

    const symbol = stock.symbol?.trim().toUpperCase();
    if (!symbol) {
      toast({ title: 'Invalid symbol', description: 'Select a valid stock symbol.', variant: 'destructive' });
      return;
    }
    if (!/^[A-Z]{1,5}$/.test(symbol)) {
      toast({ title: 'Unsupported symbol', description: 'Trading supports 1–5 letter symbols only.', variant: 'destructive' });
      return;
    }
    if (!stock.companyName?.trim()) {
      toast({ title: 'Invalid company name', description: 'Stock data is missing a company name.', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(Number(stock.price)) || Number(stock.price) <= 0) {
      toast({ title: 'Price unavailable', description: 'Live price is not available yet. Try again in a moment.', variant: 'destructive' });
      return;
    }

    if (!predictionThesis.trim()) {
      toast({ title: 'Prediction required', description: 'Explain why you expect this move.', variant: 'destructive' });
      return;
    }

    if (orderType === 'limit' && !(Number(limitPrice) > 0)) {
      toast({ title: 'Limit price required', description: 'Enter a valid limit price.', variant: 'destructive' });
      return;
    }

    if (orderType === 'stop' && !(Number(stopPrice) > 0)) {
      toast({ title: 'Stop price required', description: 'Enter a valid stop price.', variant: 'destructive' });
      return;
    }

    const predictionHorizonAt = getPredictionHorizonAt(predictionHorizon);
    const predictionTargetValue = predictionTarget ? Number(predictionTarget) : null;

    try {
      if (orderType === 'market') {
        await executeTrade.mutateAsync({
          symbol: stock.symbol,
          companyName: stock.companyName,
          tradeType,
          orderType,
          shares: Number(shares),
          price: stock.price,
          sector: stock.sector,
          predictionDirection,
          predictionThesis: predictionThesis.trim(),
          predictionIndicators,
          predictionTarget: Number.isFinite(predictionTargetValue as number) ? predictionTargetValue : null,
          predictionHorizonAt,
        });
        toast({ title: 'Trade executed!', description: `${tradeVerb} ${shares} shares of ${stock.symbol}` });
      } else {
        await placeOrder.mutateAsync({
          symbol: stock.symbol,
          companyName: stock.companyName,
          tradeType,
          orderType,
          shares: Number(shares),
          price: stock.price,
          sector: stock.sector,
          limitPrice: orderType === 'limit' ? Number(limitPrice) : null,
          stopPrice: orderType === 'stop' ? Number(stopPrice) : null,
        });
        toast({
          title: 'Order placed!',
          description: `${tradeActionLabel} ${stock.symbol} is pending.`,
        });
      }

      setShares('');
      setLimitPrice('');
      setStopPrice('');
      setPredictionThesis('');
      setPredictionIndicators([]);
      setPredictionTarget('');
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
          
          <ProfessionalCandlestickChart 
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
          <StockNews symbol={stock.symbol} />
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
                <span className="ml-4">
                  • Position: {Number(currentHolding.shares) < 0 ? 'Short' : 'Long'} {Math.abs(Number(currentHolding.shares)).toFixed(2)} shares
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={tradeType} onValueChange={(v) => handleTradeTypeChange(v as 'buy' | 'sell' | 'short' | 'cover')}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="buy">Buy</TabsTrigger>
                <TabsTrigger value="sell" disabled={!currentHolding || Number(currentHolding.shares) <= 0}>
                  Sell
                </TabsTrigger>
                <TabsTrigger value="short">Short</TabsTrigger>
                <TabsTrigger value="cover" disabled={!currentHolding || Number(currentHolding.shares) >= 0}>
                  Cover
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-4">
              <div className="space-y-4 rounded-lg border bg-secondary/30 p-4">
                <div className="text-sm font-semibold">Prediction (required)</div>

                <div className="space-y-2">
                  <Label>Direction</Label>
                  <Tabs value={predictionDirection} onValueChange={(v) => setPredictionDirection(v as PredictionDirection)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="up">Price Up</TabsTrigger>
                      <TabsTrigger value="down">Price Down</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label>Why will it move?</Label>
                  <Textarea
                    value={predictionThesis}
                    onChange={(e) => setPredictionThesis(e.target.value)}
                    placeholder="Example: RSI divergence and volume spike signal a reversal."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Make it explicit. You will be graded against this prediction.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Prediction horizon</Label>
                    <Select value={predictionHorizon} onValueChange={setPredictionHorizon}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {predictionHorizonOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target price (optional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={predictionTarget}
                      onChange={(e) => setPredictionTarget(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Indicators (optional)</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {predictionIndicatorOptions.map((indicator) => (
                      <label key={indicator} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={predictionIndicators.includes(indicator)}
                          onCheckedChange={(checked) => {
                            const isChecked = checked === true;
                            setPredictionIndicators((prev) =>
                              isChecked
                                ? [...prev, indicator]
                                : prev.filter((item) => item !== indicator)
                            );
                          }}
                        />
                        <span>{indicator}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

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

              {orderType === 'limit' && (
                <div>
                  <Label>Limit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                  />
                </div>
              )}

              {orderType === 'stop' && (
                <div>
                  <Label>Stop Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={stopPrice}
                    onChange={(e) => setStopPrice(e.target.value)}
                  />
                </div>
              )}

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
                    <span className="font-semibold">${(orderPrice || stock.price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Shares:</span>
                    <span className="font-semibold">{Number(shares).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total {estimateLabel}:</span>
                    <span className={isBuyAction && totalCost > Number(portfolio?.cash_balance || 0) ? 'text-destructive' : ''}>
                      ${totalCost.toFixed(2)}
                    </span>
                  </div>
                  {isBuyAction && totalCost > Number(portfolio?.cash_balance || 0) && (
                    <p className="text-xs text-destructive mt-2">Insufficient funds</p>
                  )}
                  {tradeType === 'sell' && currentHolding && Number(shares) > Number(currentHolding.shares) && (
                    <p className="text-xs text-destructive mt-2">Insufficient shares</p>
                  )}
                  {tradeType === 'cover' && currentHolding && Number(shares) > Math.abs(Number(currentHolding.shares)) && (
                    <p className="text-xs text-destructive mt-2">Insufficient shares</p>
                  )}
                </div>
              )}

              <Button
                onClick={handleTrade}
                disabled={
                  isSubmitting ||
                  !shares ||
                  Number(shares) <= 0 ||
                  !isPredictionValid ||
                  !isOrderPriceValid ||
                  (isBuyAction && totalCost > Number(portfolio?.cash_balance || 0)) ||
                  (tradeType === 'sell' && currentHolding && Number(shares) > Number(currentHolding.shares)) ||
                  (tradeType === 'cover' && currentHolding && Number(shares) > Math.abs(Number(currentHolding.shares)))
                }
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {isBuyAction ? <TrendingUp className="w-4 h-4 mr-2" /> : <TrendingDown className="w-4 h-4 mr-2" />}
                    {tradeActionLabel} {stock.symbol}
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
