import { useState, useEffect, useMemo, type KeyboardEvent } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowUpDown, TrendingUp, TrendingDown, Search, Loader2, ExternalLink, BarChart3, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ToastAction } from '@/components/ui/toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Stock } from '@/data/mockStocks';
import { searchTickers, getTickerInfo } from '@/data/russell5000Tickers';
import { usePortfolio, useHoldings, useExecuteTrade } from '@/hooks/usePortfolio';
import { usePlaceOrder } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { useLearningModules, useUserProgress } from '@/hooks/useLearning';
import { useStockQuote, useSearchStock, StockQuote } from '@/hooks/useStockAPI';
import { getUserFriendlyError } from '@/lib/errorMessages';
import { saveTradePlan } from '@/lib/disciplinePlans';
import { useDisciplineScore } from '@/hooks/useDisciplineScore';
import { useSkillTreeProgress } from '@/hooks/useSkillTreeProgress';
import {
  predictionIndicatorOptions,
  predictionHorizonOptions,
  getPredictionHorizonAt,
  type PredictionDirection,
} from '@/lib/tradePredictions';
import StockLineChart from '@/components/StockLineChart';
import ProfessionalCandlestickChart from '@/components/ProfessionalCandlestickChart';
import StockNews from '@/components/StockNews';
import LockedFeatureCard from '@/components/LockedFeatureCard';
import { useAuth } from '@/contexts/AuthContext';
import { getLessonByTitle } from '@/lib/learning';

const TradePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSymbol = searchParams.get('symbol') || '';
  const navigate = useNavigate();
  
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [tickerSearch, setTickerSearch] = useState('');
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
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [liveStockData, setLiveStockData] = useState<StockQuote | null>(null);
  const [marginTradingEnabled, setMarginTradingEnabled] = useState(false);
  
  const { user } = useAuth();
  const { data: portfolio } = usePortfolio();
  const { data: holdings } = useHoldings();
  const executeTrade = useExecuteTrade();
  const placeOrder = usePlaceOrder();
  const { toast } = useToast();
  const searchStock = useSearchStock();
  const { score: disciplineScore, isAtRisk } = useDisciplineScore();
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
  
  // Fetch live data for selected symbol - only when symbol changes
  const { data: liveQuote, isLoading: isLoadingQuote, error: quoteError } = useStockQuote(selectedSymbol);
  
  // Update live stock data when quote changes - memoized to prevent unnecessary updates
  useEffect(() => {
    if (liveQuote && liveQuote.symbol === selectedSymbol) {
      setLiveStockData(liveQuote);
    }
  }, [liveQuote, selectedSymbol]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('teenvest.marginTrading.enabled');
    if (saved !== null) {
      setMarginTradingEnabled(saved === 'true');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('teenvest.marginTrading.enabled', String(marginTradingEnabled));
  }, [marginTradingEnabled]);

  useEffect(() => {
    if (isAtRisk && marginTradingEnabled) {
      setMarginTradingEnabled(false);
    }
  }, [isAtRisk, marginTradingEnabled]);

  const handleTickerSearch = async () => {
    if (!tickerSearch.trim()) return;
    
    const ticker = tickerSearch.trim().toUpperCase();
    
    try {
      const result = await searchStock.mutateAsync(ticker);
      setSelectedSymbol(result.symbol);
      setLiveStockData(result);
      setTickerSearch('');
      setSearchParams({ symbol: result.symbol });
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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTickerSearch();
    }
  };

  // Use live data from either the quote hook or search mutation - memoized
  const tickerInfo = useMemo(() => getTickerInfo(selectedSymbol), [selectedSymbol]);
  const currentQuote = liveStockData || liveQuote;
  const selectedStock: Stock | null = useMemo(() => {
    if (!currentQuote) return null;
    return {
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
    };
  }, [currentQuote, tickerInfo]);
  
  const cashBalance = Number(portfolio?.cash_balance || 0);
  const marginMultiplier = marginTradingEnabled ? 2 : 1;
  const buyingPower = cashBalance * marginMultiplier;
  const buyingPowerLabel = marginTradingEnabled
    ? `Buying power: $${buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2 })} (2x cash)`
    : `Cash available: $${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const orderPrice = useMemo(() => {
    if (!selectedStock) return 0;
    if (orderType === 'limit') return Number(limitPrice) || 0;
    if (orderType === 'stop') return Number(stopPrice) || 0;
    return selectedStock.price;
  }, [selectedStock, orderType, limitPrice, stopPrice]);

  const totalCost = useMemo(() => {
    return selectedStock ? Number(shares) * (orderPrice || selectedStock.price) : 0;
  }, [selectedStock, shares, orderPrice]);

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

  const isPredictionValid = predictionThesis.trim().length >= 6;
  const isOrderPriceValid =
    orderType === 'market' ||
    (orderType === 'limit' ? Number(limitPrice) > 0 : Number(stopPrice) > 0);
  const isSubmitting = executeTrade.isPending || placeOrder.isPending;
  
  const currentHolding = useMemo(() => {
    return holdings?.find(h => h.symbol === selectedSymbol);
  }, [holdings, selectedSymbol]);

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

  const handleSelectHolding = (symbol: string, sharesOwned: number) => {
    setSelectedSymbol(symbol);
    setTradeType(sharesOwned < 0 ? 'cover' : 'sell');
    setOrderType('market');
    setShares(Math.abs(sharesOwned).toFixed(2));
  };

  const handleTrade = async () => {
    if (!selectedStock || !shares || Number(shares) <= 0) {
      toast({ title: 'Invalid trade', description: 'Please select a stock and enter shares', variant: 'destructive' });
      return;
    }

    const symbol = selectedStock.symbol?.trim().toUpperCase();
    if (!symbol) {
      toast({ title: 'Invalid symbol', description: 'Select a valid stock symbol.', variant: 'destructive' });
      return;
    }
    if (!/^[A-Z]{1,5}$/.test(symbol)) {
      toast({ title: 'Unsupported symbol', description: 'Trading supports 1–5 letter symbols only.', variant: 'destructive' });
      return;
    }
    if (!selectedStock.companyName?.trim()) {
      toast({ title: 'Invalid company name', description: 'Stock data is missing a company name.', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(Number(selectedStock.price)) || Number(selectedStock.price) <= 0) {
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

    if ((tradeType === 'buy' || tradeType === 'cover') && totalCost > buyingPower) {
      const formattedPower = buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2 });
      const formattedCash = cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 });
      toast({
        title: 'Insufficient buying power',
        description: marginTradingEnabled
          ? `Max buying power is $${formattedPower}. Reduce size or add cash.`
          : `You have $${formattedCash} available. Enable margin trading to use up to 2x cash.`,
        variant: 'destructive',
      });
      return;
    }

    const takeProfitValue = takeProfit ? Number(takeProfit) : null;
    const stopLossValue = stopLoss ? Number(stopLoss) : null;

    if (takeProfit && !(Number.isFinite(takeProfitValue) && takeProfitValue > 0)) {
      toast({ title: 'Invalid take profit', description: 'Enter a valid take profit price.', variant: 'destructive' });
      return;
    }

    if (stopLoss && !(Number.isFinite(stopLossValue) && stopLossValue > 0)) {
      toast({ title: 'Invalid stop loss', description: 'Enter a valid stop loss price.', variant: 'destructive' });
      return;
    }

    const predictionHorizonAt = getPredictionHorizonAt(predictionHorizon);
    const predictionTargetValue = predictionTarget ? Number(predictionTarget) : null;
    const planData = takeProfitValue || stopLossValue
      ? {
          takeProfit: takeProfitValue,
          stopLoss: stopLossValue,
          createdAt: new Date().toISOString(),
          symbol: selectedStock.symbol,
          tradeType,
        }
      : null;

    try {
      if (orderType === 'market') {
        const result = await executeTrade.mutateAsync({
          symbol: selectedStock.symbol,
          companyName: selectedStock.companyName,
          tradeType,
          orderType,
          shares: Number(shares),
          price: selectedStock.price,
          sector: selectedStock.sector,
          allowMargin: marginTradingEnabled,
          marginMultiplier,
          predictionDirection,
          predictionThesis: predictionThesis.trim(),
          predictionIndicators,
          predictionTarget: Number.isFinite(predictionTargetValue as number) ? predictionTargetValue : null,
          predictionHorizonAt,
        });
        if (user && planData && (result as any)?.trade_id) {
          saveTradePlan(user.id, (result as any).trade_id, planData);
        }
        toast({ title: 'Trade executed!', description: `${tradeVerb} ${shares} shares of ${selectedStock.symbol}` });
      } else {
        const orderResult = await placeOrder.mutateAsync({
          symbol: selectedStock.symbol,
          companyName: selectedStock.companyName,
          tradeType,
          orderType,
          shares: Number(shares),
          price: selectedStock.price,
          sector: selectedStock.sector,
          limitPrice: orderType === 'limit' ? Number(limitPrice) : null,
          stopPrice: orderType === 'stop' ? Number(stopPrice) : null,
        });
        if (user && planData && (orderResult as any)?.id) {
          saveTradePlan(user.id, (orderResult as any).id, planData);
        }
        toast({
          title: 'Order placed!',
          description: `${tradeActionLabel} ${selectedStock.symbol} is pending.`,
        });
      }

      setShares('');
      setLimitPrice('');
      setStopPrice('');
      setPredictionThesis('');
      setPredictionIndicators([]);
      setPredictionTarget('');
      setTakeProfit('');
      setStopLoss('');
    } catch (error: any) {
      toast({ title: 'Trade failed', description: getUserFriendlyError(error), variant: 'destructive' });
    }
  };

  // Show loading state if portfolio or holdings are loading
  if (!portfolio || !holdings) {
    return (
      <DashboardLayout>
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading trading data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Trade</h1>
          <p className="text-muted-foreground">Buy and sell stocks with virtual money</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {/* Stock Selection & Info */}
            <Card>
              <CardHeader>
                <CardTitle>Select Stock</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
              {(() => {
                if (!tickerSearch || searchStock.isPending) return null;
                const matches = searchTickers(tickerSearch, 10);
                return (
                  <div className="border rounded-lg bg-background max-h-36 overflow-y-auto">
                    <p className="text-xs text-muted-foreground p-2 border-b">
                      Showing matches:
                    </p>
                    {matches.map(t => (
                      <button
                        key={t.symbol}
                        className="w-full text-left px-3 py-2 hover:bg-secondary text-sm flex justify-between items-center transition-colors"
                        onClick={() => {
                          setSelectedSymbol(t.symbol);
                          setLiveStockData(null);
                          setTickerSearch('');
                          setSearchParams({ symbol: t.symbol });
                        }}
                      >
                        <span><strong>{t.symbol}</strong> - {t.name}</span>
                        <span className="text-xs text-muted-foreground">{t.sector}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {isLoadingQuote && selectedSymbol && (
                <div className="p-4 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading live data...</span>
                </div>
              )}

              {quoteError && selectedSymbol && !isLoadingQuote && !selectedStock && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex flex-col items-center justify-center text-center">
                  <AlertTriangle className="w-8 h-8 text-destructive mb-2" />
                  <p className="font-semibold text-destructive mb-1">Stock Not Found</p>
                  <p className="text-sm text-muted-foreground">Could not find data for "{selectedSymbol}"</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => {
                      setSelectedSymbol('');
                      setLiveStockData(null);
                    }}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}

              {selectedStock && !isLoadingQuote && (
                <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xl font-bold">{selectedStock.symbol}</p>
                      <p className="text-sm text-muted-foreground">{selectedStock.companyName}</p>
                      {liveStockData && (
                        <p className="text-xs text-primary">Live data</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">${Number(selectedStock.price).toFixed(2)}</p>
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
                      <p className="text-sm text-muted-foreground">
                        Position:{' '}
                        <span className="font-medium text-foreground">
                          {Number(currentHolding.shares) < 0 ? 'Short' : 'Long'} {Math.abs(Number(currentHolding.shares)).toFixed(2)} shares
                        </span>
                      </p>
                    </div>
                  )}
                  <Link to={`/research?symbol=${selectedStock.symbol}`}>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Full Charts
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Holdings</CardTitle>
                <CardDescription>Quickly pick a position to sell</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {holdings && holdings.length > 0 ? (
                  holdings.map((holding) => (
                    <div key={holding.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="font-semibold">{holding.symbol}</div>
                        <div className="text-xs text-muted-foreground">
                        {Math.abs(Number(holding.shares)).toFixed(2)} shares · Avg ${Number(holding.average_cost).toFixed(2)} ·{' '}
                        {Number(holding.shares) < 0 ? 'Short' : 'Long'}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectHolding(holding.symbol, Number(holding.shares))}
                      >
                      {Number(holding.shares) < 0 ? 'Cover' : 'Sell'}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No holdings yet.</div>
                )}
              </CardContent>
            </Card>

            {isAtRisk ? (
              <LockedFeatureCard
                title="Margin Trading Locked"
                description="Your Discipline Score is below 50. Stabilize exits and sizing to unlock margin trading."
                ctaLabel="View Discipline Score"
                ctaHref="/dashboard"
              />
            ) : (
              <Card>
                <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      Margin Trading (Pro)
                    </CardTitle>
                    <CardDescription>
                      Access leverage once your discipline stays above 50.
                    </CardDescription>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="What is margin trading?"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Boosts buying power up to 2x cash for buys and covers. Cash balance can go negative.
                    </TooltipContent>
                  </Tooltip>
                </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Enable margin trading</div>
                    <div className="text-xs text-muted-foreground">
                      Current Discipline Score: {disciplineScore}/100
                    </div>
                  <div className="text-xs text-muted-foreground">
                    {buyingPowerLabel}
                  </div>
                  </div>
                  <Switch
                    checked={marginTradingEnabled}
                    onCheckedChange={setMarginTradingEnabled}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Order Form */}
            <Card>
              <CardHeader>
                <CardTitle>Place Order</CardTitle>
                <CardDescription>{buyingPowerLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              <Tabs value={tradeType} onValueChange={(v) => handleTradeTypeChange(v as 'buy' | 'sell' | 'short' | 'cover')}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="buy">Buy</TabsTrigger>
                  <TabsTrigger value="sell">Sell</TabsTrigger>
                  <TabsTrigger value="short">Short</TabsTrigger>
                  <TabsTrigger value="cover">Cover</TabsTrigger>
                </TabsList>
              </Tabs>

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

              <div className="space-y-2">
                <Label>Trade plan (optional)</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Take profit</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stop loss</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Used to track plan adherence in your Discipline Score.
                </p>
              </div>

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

              {orderType === 'limit' && (
                <div className="space-y-2">
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
                <div className="space-y-2">
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

              <div className="space-y-2">
                <Label>Number of Shares</Label>
                <Input type="number" value={shares} onChange={(e) => setShares(e.target.value)} placeholder="0" min="0" step="1" />
              </div>

              {selectedStock && shares && (
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated {estimateLabel}</span>
                    <span className="font-bold">${totalCost.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleTrade} 
                disabled={!selectedStock || !shares || !isPredictionValid || !isOrderPriceValid || isSubmitting}
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Processing...' : `${tradeActionLabel} ${selectedStock?.symbol || 'Stock'}`}
              </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {selectedStock && currentQuote && (
          <div className="grid gap-6 lg:grid-cols-2">
            <StockLineChart
              symbol={selectedStock.symbol}
              currentPrice={Number(currentQuote.price) || 0}
              previousClose={Number(currentQuote.previousClose) || Number(currentQuote.price) || 0}
              high={Number(currentQuote.high) || 0}
              low={Number(currentQuote.low) || 0}
              open={Number(currentQuote.open) || 0}
            />

            <ProfessionalCandlestickChart
              symbol={selectedStock.symbol}
              currentPrice={Number(currentQuote.price) || 0}
              previousClose={Number(currentQuote.previousClose) || Number(currentQuote.price) || 0}
              high={Number(currentQuote.high) || 0}
              low={Number(currentQuote.low) || 0}
              open={Number(currentQuote.open) || 0}
            />
          </div>
        )}

        {/* Stock News */}
        {selectedStock && <StockNews symbol={selectedStock.symbol} />}

      </div>
    </DashboardLayout>
  );
};

export default TradePage;
