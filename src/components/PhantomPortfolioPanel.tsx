import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Users, TrendingUp, TrendingDown, DollarSign, Briefcase, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeaderboard, type LeaderboardEntry } from '@/hooks/useLeaderboard';
import { useCopyTrading } from '@/hooks/useCopyTrading';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { usePhantomPortfolio } from '@/hooks/usePhantomPortfolio';
import { getStockBySymbol, mockStocks } from '@/data/mockStocks';
import { useMultipleStockQuotes, useStockQuote } from '@/hooks/useStockAPI';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type PhantomPortfolioPanelProps = {
  userTotalValue: number;
};

const COLORS = ['hsl(142, 76%, 36%)', 'hsl(262, 83%, 58%)', 'hsl(200, 98%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(340, 82%, 52%)'];

const safeNumber = (value: number, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

const formatCurrency = (value: number) => {
  const safe = safeNumber(value);
  return `$${safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const PhantomPortfolioPanel = ({ userTotalValue }: PhantomPortfolioPanelProps) => {
  const { data: leaderboard, isLoading } = useLeaderboard();
  const { copiedIds, activeCopyId, setActiveCopyId } = useCopyTrading();
  const { toast } = useToast();
  const { state, syncFromCopy, executeTrade, reset } = usePhantomPortfolio(userTotalValue);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeSymbol, setTradeSymbol] = useState(mockStocks[0]?.symbol ?? '');
  const [tradeShares, setTradeShares] = useState('');

  const copiedEntries = useMemo(() => {
    if (!leaderboard) return [];
    return copiedIds
      .map((id) => leaderboard.find((entry) => entry.user_id === id))
      .filter((entry): entry is LeaderboardEntry => Boolean(entry));
  }, [copiedIds, leaderboard]);

  const activeEntry =
    copiedEntries.find((entry) => entry.user_id === activeCopyId) || copiedEntries[0];

  const holdingSymbols = useMemo(
    () => state.holdings.map((holding) => holding.symbol),
    [state.holdings]
  );
  const { data: holdingQuotes } = useMultipleStockQuotes(holdingSymbols);
  const { data: tradeQuote } = useStockQuote(tradeSymbol);

  const priceMap = useMemo(() => {
    const map = new Map<string, number>();
    (holdingQuotes || []).forEach((quote) => {
      if (quote?.symbol && Number.isFinite(quote.price)) {
        map.set(quote.symbol, Number(quote.price));
      }
    });
    return map;
  }, [holdingQuotes]);

  const phantomStats = useMemo(() => {
    const investedValue = state.holdings.reduce((sum, holding) => {
      const fallbackPrice = getStockBySymbol(holding.symbol)?.price ?? holding.averageCost;
      const price = safeNumber(priceMap.get(holding.symbol) ?? fallbackPrice ?? 0);
      return sum + safeNumber(holding.shares) * price;
    }, 0);
    const cashBalance = safeNumber(state.cashBalance);
    const totalValue = investedValue + cashBalance;
    const startingBalance = safeNumber(state.startingBalance);
    const totalGain = totalValue - startingBalance;
    const gainPercent = startingBalance > 0 ? (totalGain / startingBalance) * 100 : 0;
    return {
      investedValue: safeNumber(investedValue),
      totalValue: safeNumber(totalValue),
      totalGain: safeNumber(totalGain),
      gainPercent: safeNumber(gainPercent),
      startingBalance,
      cashBalance,
    };
  }, [priceMap, state.cashBalance, state.holdings, state.startingBalance]);

  const ratioLabel = useMemo(() => {
    if (!activeEntry || activeEntry.total_value <= 0 || userTotalValue <= 0) return '—';
    const ratio = userTotalValue / activeEntry.total_value;
    if (ratio >= 1) return `${ratio.toFixed(2)} : 1`;
    return `1 : ${(1 / ratio).toFixed(2)}`;
  }, [activeEntry, userTotalValue]);

  const ratioCopyText = useMemo(() => {
    if (!activeEntry || activeEntry.total_value <= 0 || userTotalValue <= 0) return '—';
    const ratio = userTotalValue / activeEntry.total_value;
    if (ratio >= 1) return `$${ratio.toFixed(2)} for each $1`;
    return `$1 for each $${(1 / ratio).toFixed(2)}`;
  }, [activeEntry, userTotalValue]);

  const phantomSectorData = useMemo(() => {
    const sectorMap = new Map<string, number>();
    state.holdings.forEach((holding) => {
      const fallbackPrice = getStockBySymbol(holding.symbol)?.price ?? holding.averageCost;
      const price = safeNumber(priceMap.get(holding.symbol) ?? fallbackPrice ?? 0);
      const value = safeNumber(holding.shares) * price;
      const sector = getStockBySymbol(holding.symbol)?.sector || 'Other';
      const current = sectorMap.get(sector) || 0;
      sectorMap.set(sector, current + value);
    });
    return Array.from(sectorMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [priceMap, state.holdings]);

  const tradePrice = useMemo(() => {
    if (tradeQuote?.price) return Number(tradeQuote.price);
    return getStockBySymbol(tradeSymbol)?.price ?? 0;
  }, [tradeQuote?.price, tradeSymbol]);

  const tradeTotal = useMemo(() => {
    const shares = Number(tradeShares);
    if (!Number.isFinite(shares) || shares <= 0) return 0;
    return shares * tradePrice;
  }, [tradeShares, tradePrice]);

  const handleSync = () => {
    if (!activeEntry) return;
    syncFromCopy({
      guruId: activeEntry.user_id,
      guruValue: activeEntry.total_value,
      userValue: userTotalValue,
    });
    toast({
      title: 'Phantom portfolio synced',
      description: 'Your phantom holdings now match the copied trader ratio.',
    });
  };

  const handleTrade = () => {
    const shares = Number(tradeShares);
    const selectedStock = getStockBySymbol(tradeSymbol);
    const companyName = selectedStock?.companyName || tradeSymbol;
    const result = executeTrade({
      symbol: tradeSymbol,
      companyName,
      tradeType,
      shares,
      price: tradePrice,
    });

    if (!result.ok) {
      toast({
        title: 'Phantom trade failed',
        description: result.error || 'Unable to place trade.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Phantom trade executed',
      description: `${tradeType === 'buy' ? 'Bought' : 'Sold'} ${shares} ${tradeSymbol} shares.`,
    });
    setTradeShares('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Loading phantom portfolio...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Phantom Portfolio
          </CardTitle>
          <CardDescription>
            Copy a top trader, then trade independently without touching leaderboards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">Copying</div>
              <div className="text-lg font-semibold">
                {activeEntry ? activeEntry.display_name : 'No trader selected'}
              </div>
              <div className="text-xs text-muted-foreground">
                {activeEntry
                  ? `Leaderboard value ${formatCurrency(activeEntry.total_value)}`
                  : 'Pick a trader to sync a starting copy.'}
              </div>
              <div className="text-xs text-muted-foreground">
                Ratio {ratioLabel} · {ratioCopyText}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {copiedEntries.length > 1 && activeEntry && (
                <Select value={activeEntry.user_id} onValueChange={setActiveCopyId}>
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {copiedEntries.map((entry) => (
                      <SelectItem key={entry.user_id} value={entry.user_id}>
                        {entry.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" className="gap-2" onClick={handleSync} disabled={!activeEntry}>
                <RefreshCw className="w-4 h-4" />
                Sync Copy
              </Button>
              <Button variant="ghost" className="gap-2" onClick={() => reset(userTotalValue)}>
                Reset
              </Button>
              {!activeEntry && (
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/leaderboard">
                    <Copy className="w-4 h-4" />
                    Find a trader
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Source: {state.source?.type ?? 'manual'}</Badge>
            {state.lastUpdatedAt && (
              <span>Last update {new Date(state.lastUpdatedAt).toLocaleString()}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Phantom Total Value
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(phantomStats.totalValue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Phantom Cash
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(phantomStats.cashBalance)}
            </div>
            <p className="text-xs text-muted-foreground">Available to allocate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Phantom Invested
            </CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(phantomStats.investedValue)}
            </div>
            <p className="text-xs text-muted-foreground">{state.holdings.length} positions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Phantom Gain/Loss
            </CardTitle>
            {phantomStats.totalGain >= 0 ? (
              <TrendingUp className="w-4 h-4 text-primary" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${phantomStats.totalGain >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {phantomStats.totalGain >= 0 ? '+' : ''}
              {formatCurrency(phantomStats.totalGain)}
            </div>
            <p className="text-xs text-muted-foreground">
              {phantomStats.gainPercent >= 0 ? '+' : ''}{phantomStats.gainPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Holdings</CardTitle>
            <CardDescription>Current stock positions</CardDescription>
          </CardHeader>
          <CardContent>
            {state.holdings.length > 0 ? (
              <div className="space-y-4">
                {state.holdings.map((holding) => {
                  const fallbackPrice = getStockBySymbol(holding.symbol)?.price ?? holding.averageCost;
                  const currentPrice = safeNumber(priceMap.get(holding.symbol) ?? fallbackPrice ?? 0);
                  const currentValue = safeNumber(holding.shares) * currentPrice;
                  const costBasis = safeNumber(holding.shares) * safeNumber(holding.averageCost);
                  const gain = currentValue - costBasis;
                  const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;

                  return (
                    <div key={holding.symbol} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div>
                        <p className="font-semibold">{holding.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {safeNumber(holding.shares).toFixed(2)} shares @ ${safeNumber(holding.averageCost).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(currentValue)}</p>
                        <p className={`text-sm ${gain >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {gain >= 0 ? '+' : ''}{safeNumber(gainPercent).toFixed(2)}%
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
                <Button onClick={() => setTradeType('buy')}>Make a Phantom Trade</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Diversity</CardTitle>
            <CardDescription>Allocation by sector</CardDescription>
          </CardHeader>
          <CardContent>
            {phantomSectorData.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={phantomSectorData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {phantomSectorData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {phantomSectorData.map((sector, index) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Phantom Trade</CardTitle>
            <CardDescription>Trade your phantom account independently.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={tradeType} onValueChange={(value) => setTradeType(value as 'buy' | 'sell')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">Buy</TabsTrigger>
                <TabsTrigger value="sell">Sell</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <label className="text-sm font-medium">Symbol</label>
              <Select value={tradeSymbol} onValueChange={setTradeSymbol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockStocks.map((stock) => (
                    <SelectItem key={stock.symbol} value={stock.symbol}>
                      {stock.symbol} · {stock.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                Price: ${tradePrice.toFixed(2)} {tradeQuote ? '(live)' : '(simulated)'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Shares</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={tradeShares}
                onChange={(event) => setTradeShares(event.target.value)}
                placeholder="0"
              />
              {tradeTotal > 0 && (
                <div className="text-xs text-muted-foreground">
                  Estimated {tradeType === 'buy' ? 'cost' : 'value'} {formatCurrency(tradeTotal)}
                </div>
              )}
            </div>

            <Button className="w-full" onClick={handleTrade} disabled={!tradeSymbol || !tradeShares}>
              {tradeType === 'buy' ? 'Buy' : 'Sell'} Phantom Shares
            </Button>
          </CardContent>
        </Card>
      </div>

      <Badge variant="outline" className="text-xs">
        Phantom trades stay off the leaderboard
      </Badge>
    </div>
  );
};

export default PhantomPortfolioPanel;
