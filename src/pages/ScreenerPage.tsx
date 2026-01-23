import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, Loader2, Star, StarOff, Eye, RefreshCw, ChevronUp, ChevronDown, ArrowUpDown, Flame, Sparkles, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { formatMarketCap, formatVolume, Stock } from '@/data/mockStocks';
import { russell5000Tickers, searchTickers, getAllSectors, getTotalTickerCount, getTickerInfo, popularTickers } from '@/data/russell5000Tickers';
import { Link, useNavigate } from 'react-router-dom';
import { fetchStockQuote, useSearchStock, useMultipleStockQuotes, StockQuote } from '@/hooks/useStockAPI';
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '@/hooks/useWatchlist';
import { useToast } from '@/hooks/use-toast';
import { useCachedStocks, useRefreshStockCache, cachedToQuote, isCacheStale } from '@/hooks/useStockCache';

type SortColumn = 'symbol' | 'price' | 'changePercent' | 'marketCap' | 'volume' | 'riskLevel';
type SortDirection = 'asc' | 'desc';

const ScreenerPage = () => {
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  
  const [marketCapFilter, setMarketCapFilter] = useState<string>('all');
  const [searchedStocks, setSearchedStocks] = useState<StockQuote[]>([]);
  const [autoFetchedStocks, setAutoFetchedStocks] = useState<StockQuote[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [visibleCount, setVisibleCount] = useState(20); // Start with top 20
  const [loadedStocksCount, setLoadedStocksCount] = useState(20); // Track how many stocks we've loaded from full list
  const [sortColumn, setSortColumn] = useState<SortColumn>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const fetchedSymbolsRef = useRef<Set<string>>(new Set());
  
  const navigate = useNavigate();
  const searchStock = useSearchStock();
  const { toast } = useToast();
  const { data: watchlist } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  
  // Load cached stocks first (instant!)
  const { data: cachedStocks, isLoading: loadingCache } = useCachedStocks();
  const refreshCache = useRefreshStockCache();
  
  // Convert cached stocks to StockQuote format
  const cachedStockQuotes = useMemo(() => {
    if (!cachedStocks) return [];
    return cachedStocks.map(cachedToQuote);
  }, [cachedStocks]);
  
  // Check if cache is stale and needs refresh
  useEffect(() => {
    if (cachedStocks && cachedStocks.length > 0) {
      const newestCache = cachedStocks[0];
      if (isCacheStale(newestCache.cached_at, 5)) {
        console.log('Cache is stale, refreshing in background...');
        refreshCache.mutate(undefined);
      }
    } else if (cachedStocks && cachedStocks.length === 0) {
      // No cache exists, populate it
      console.log('No cache found, populating...');
      refreshCache.mutate(undefined);
    }
  }, [cachedStocks]);
  
  // Also fetch watchlist stocks live
  const watchlistSymbols = useMemo(() => watchlist?.map(w => w.symbol) || [], [watchlist]);
  const { data: watchlistStockData, refetch: refetchWatchlist } = useMultipleStockQuotes(watchlistSymbols);
  
  const sectors = getAllSectors();
  const totalStocks = getTotalTickerCount();

  // Combine cached data with live fetched data (live takes priority)
  const allLiveData = useMemo(() => {
    const combined: StockQuote[] = [];
    
    // Start with cached stocks (instant load)
    cachedStockQuotes.forEach(stock => {
      if (!combined.some(s => s.symbol === stock.symbol)) combined.push(stock);
    });
    
    // Overlay watchlist live data
    if (watchlistStockData) {
      watchlistStockData.forEach(stock => {
        const idx = combined.findIndex(s => s.symbol === stock.symbol);
        if (idx >= 0) combined[idx] = stock; // Replace with fresh data
        else combined.push(stock);
      });
    }
    
    // Overlay auto-fetched stocks
    if (autoFetchedStocks.length > 0) {
      autoFetchedStocks.forEach(stock => {
        const idx = combined.findIndex(s => s.symbol === stock.symbol);
        if (idx >= 0) combined[idx] = stock;
        else combined.push(stock);
      });
    }
    
    // Overlay searched stocks
    searchedStocks.forEach(stock => {
      const idx = combined.findIndex(s => s.symbol === stock.symbol);
      if (idx >= 0) combined[idx] = stock;
      else combined.push(stock);
    });
    
    return combined;
  }, [cachedStockQuotes, watchlistStockData, autoFetchedStocks, searchedStocks]);

  const isInWatchlist = (symbol: string) => {
    return watchlist?.some(w => w.symbol === symbol);
  };

  const handleToggleWatchlist = async (symbol: string, companyName: string) => {
    try {
      if (isInWatchlist(symbol)) {
        await removeFromWatchlist.mutateAsync(symbol);
        toast({ title: 'Removed from watchlist', description: `${symbol} removed` });
      } else {
        await addToWatchlist.mutateAsync({ symbol, companyName });
        toast({ title: 'Added to watchlist', description: `${symbol} added` });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update watchlist', variant: 'destructive' });
    }
  };

  const handleRefresh = () => {
    refreshCache.mutate(undefined);
    refetchWatchlist();
    toast({ title: 'Refreshing...', description: 'Updating stock cache in background' });
  };

  // Get ticker suggestions based on search
  const tickerSuggestions = useMemo(() => {
    if (search.length < 1) return [];
    return searchTickers(search).slice(0, 10);
  }, [search]);

  const handleTickerSearch = async (ticker?: string) => {
    const symbolToSearch = ticker || search.trim().toUpperCase();
    if (!symbolToSearch) return;
    
    if (allLiveData.some(s => s.symbol === symbolToSearch)) {
      setShowSuggestions(false);
      setSearch('');
      return;
    }
    
    try {
      const result = await searchStock.mutateAsync(symbolToSearch);
      setSearchedStocks(prev => {
        if (prev.some(s => s.symbol === result.symbol)) return prev;
        return [result, ...prev];
      });
      toast({ 
        title: 'Stock found!', 
        description: `Added ${result.companyName} (${result.symbol}) to results` 
      });
      setSearch('');
      setShowSuggestions(false);
    } catch (error) {
      toast({ 
        title: 'Stock not found', 
        description: `Could not find ticker "${symbolToSearch}"`, 
        variant: 'destructive' 
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTickerSearch();
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Compute risk level based on volatility (changePercent)
  const computeRiskLevel = (changePercent: number): 'low' | 'medium' | 'high' => {
    const absChange = Math.abs(changePercent);
    if (absChange < 1.5) return 'low';
    if (absChange < 4) return 'medium';
    return 'high';
  };

  // Convert Russell 5000 tickers to Stock format, merging with live data
  // Only load a subset initially (top 20, then load more on scroll)
  const allStocks = useMemo(() => {
    try {
      const stocksMap = new Map<string, Stock>();
      
      // Only load top N stocks from Russell list (start with 20, expand as user scrolls)
      // Prioritize popular stocks first
      const stocksToLoad = [
        ...popularTickers.slice(0, 20), // Top 20 popular stocks
        ...(Array.isArray(russell5000Tickers) ? russell5000Tickers.slice(0, loadedStocksCount) : [])
      ];
      
      // Deduplicate by symbol
      const seen = new Set<string>();
      const uniqueStocks = stocksToLoad.filter(t => {
        if (!t || !t.symbol || seen.has(t.symbol)) return false;
        seen.add(t.symbol);
        return true;
      });
      
      uniqueStocks.forEach(t => {
        if (!t || !t.symbol) return;
        stocksMap.set(t.symbol, {
          symbol: t.symbol,
          companyName: t.name || t.symbol,
          price: 0,
          change: 0,
          changePercent: 0,
          volume: 0,
          marketCap: 0,
          sector: t.sector || 'Unknown',
          riskLevel: 'medium' as const,
          high52Week: 0,
          low52Week: 0,
        });
      });
      
      // Overlay live data
      if (Array.isArray(allLiveData)) {
        allLiveData.forEach(liveStock => {
          if (!liveStock || !liveStock.symbol) return; // Skip if no symbol
          
          const tickerInfo = getTickerInfo(liveStock.symbol);
          const changePercent = Number(liveStock.changePercent) || 0;
          stocksMap.set(liveStock.symbol, {
            symbol: liveStock.symbol,
            companyName: liveStock.companyName || liveStock.symbol,
            price: Number(liveStock.price) || 0,
            change: Number(liveStock.change) || 0,
            changePercent: changePercent,
            volume: Number(liveStock.volume) || 0,
            marketCap: Number(liveStock.marketCap) || 0,
            sector: liveStock.sector || tickerInfo?.sector || 'Unknown',
            riskLevel: computeRiskLevel(changePercent),
            high52Week: Number(liveStock.high) || 0,
            low52Week: Number(liveStock.low) || 0,
          });
        });
      }
      
      // Sort: stocks with live data first, then alphabetically by symbol
      return Array.from(stocksMap.values()).sort((a, b) => {
        const aPrice = Number(a.price) || 0;
        const bPrice = Number(b.price) || 0;
        // If both have prices or both don't, sort alphabetically
        if ((aPrice > 0) === (bPrice > 0)) {
          return a.symbol.localeCompare(b.symbol);
        }
        // Otherwise, stocks with prices come first
        if (aPrice > 0 && bPrice === 0) return -1;
        if (aPrice === 0 && bPrice > 0) return 1;
        return 0;
      });
    } catch (error) {
      console.error('Error building stocks list:', error);
      return [];
    }
  }, [allLiveData, loadedStocksCount]);

  // Top Gainers & Losers from live data
  const { topGainers, topLosers } = useMemo(() => {
    const stocksWithData = allStocks.filter(s => s.price > 0 && s.changePercent !== 0);
    const sorted = [...stocksWithData].sort((a, b) => b.changePercent - a.changePercent);
    return {
      topGainers: sorted.slice(0, 5),
      topLosers: sorted.slice(-5).reverse()
    };
  }, [allStocks]);

  // Handle column sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'symbol' ? 'asc' : 'desc');
    }
  };

  // Filter stocks based on active tab and filters
  const filteredStocks = useMemo(() => {
    let stocksToFilter = allStocks;
    
    if (activeTab === 'watchlist') {
      stocksToFilter = allStocks.filter(stock => 
        watchlist?.some(w => w.symbol === stock.symbol)
      );
    }
    
    const filtered = stocksToFilter.filter(stock => {
      const matchesSearch = stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
        stock.companyName.toLowerCase().includes(search.toLowerCase());
      const matchesSector = selectedSector === 'all' || stock.sector === selectedSector;
      const matchesRisk = selectedRisk === 'all' || stock.riskLevel === selectedRisk;
      
      const hasLiveData = stock.price > 0;
      
      let matchesMarketCap = true;
      if (hasLiveData && marketCapFilter !== 'all') {
        if (marketCapFilter === 'large') matchesMarketCap = stock.marketCap >= 200e9;
        else if (marketCapFilter === 'mid') matchesMarketCap = stock.marketCap >= 10e9 && stock.marketCap < 200e9;
        else if (marketCapFilter === 'small') matchesMarketCap = stock.marketCap < 10e9;
      }

      return matchesSearch && matchesSector && matchesRisk && matchesMarketCap;
    });

    // Apply sorting
    return filtered.sort((a, b) => {
      const aPrice = Number(a.price) || 0;
      const bPrice = Number(b.price) || 0;
      
      // Always prioritize stocks with live data
      if (aPrice > 0 && bPrice === 0) return -1;
      if (aPrice === 0 && bPrice > 0) return 1;
      
      let comparison = 0;
      switch (sortColumn) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'price':
          comparison = aPrice - bPrice;
          break;
        case 'changePercent':
          comparison = (a.changePercent || 0) - (b.changePercent || 0);
          break;
        case 'marketCap':
          comparison = (a.marketCap || 0) - (b.marketCap || 0);
          break;
        case 'volume':
          comparison = (a.volume || 0) - (b.volume || 0);
          break;
        case 'riskLevel':
          const riskOrder = { low: 1, medium: 2, high: 3 };
          comparison = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [search, selectedSector, selectedRisk, marketCapFilter, allStocks, activeTab, watchlist, sortColumn, sortDirection]);

  // Get visible stocks (for infinite scroll)
  const visibleStocks = useMemo(() => {
    return filteredStocks.slice(0, visibleCount);
  }, [filteredStocks, visibleCount]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(20);
    setLoadedStocksCount(20); // Reset loaded count too
  }, [search, selectedSector, selectedRisk, marketCapFilter, activeTab]);

  // Load more stocks when scrolling near bottom
  const handleLoadMore = useCallback(() => {
    // First, load more stocks from the full list if we haven't loaded enough
    if (loadedStocksCount < (russell5000Tickers?.length || 0)) {
      setLoadedStocksCount(prev => Math.min(prev + 50, russell5000Tickers?.length || 0));
    }
    // Then, show more visible rows
    if (visibleCount < filteredStocks.length) {
      setVisibleCount(prev => Math.min(prev + 50, filteredStocks.length));
    }
  }, [visibleCount, filteredStocks.length, loadedStocksCount]);

  // Scroll to top function
  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-fetch live data for visible rows so the table shows real numbers
  const [isFetchingBatch, setIsFetchingBatch] = useState(false);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);
  
  useEffect(() => {
    // Clear any pending fetch
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Debounce the fetch to avoid excessive API calls
    fetchTimeoutRef.current = setTimeout(() => {
      const fetchBatch = async () => {
        // Prevent concurrent fetches
        if (isFetchingRef.current) return;
        
        try {
          // Only fetch for visible stocks to reduce load
          const symbolsToFetch = visibleStocks
            .filter(s => s && s.symbol && s.price === 0)
            .slice(0, 30) // Reduced batch size to prevent overload
            .map(s => s.symbol)
            .filter((sym): sym is string => Boolean(sym) && typeof sym === 'string' && sym.trim().length > 0)
            .filter(sym => !fetchedSymbolsRef.current.has(sym));

          if (symbolsToFetch.length === 0) return;

          isFetchingRef.current = true;
          setIsFetchingBatch(true);
          symbolsToFetch.forEach(sym => fetchedSymbolsRef.current.add(sym));

          // Fetch in smaller parallel batches to avoid rate limits
          const batchSize = 5; // Reduced batch size
          for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
            const batch = symbolsToFetch.slice(i, i + batchSize);
            const results = await Promise.allSettled(batch.map(sym => fetchStockQuote(sym)));
            const ok = results
              .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled')
              .map(r => r.value)
              .filter(s => s && s.symbol);

            if (ok.length > 0) {
              setAutoFetchedStocks(prev => {
                const merged = [...prev];
                ok.forEach(s => {
                  if (!s || !s.symbol) return;
                  const idx = merged.findIndex(p => p.symbol === s.symbol);
                  if (idx >= 0) merged[idx] = s;
                  else merged.push(s);
                });
                return merged;
              });
            }
            
            // Increased delay between batches to avoid rate limiting
            if (i + batchSize < symbolsToFetch.length) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }
        } catch (error) {
          console.error('Auto-fetch error:', error);
        } finally {
          setIsFetchingBatch(false);
          isFetchingRef.current = false;
        }
      };
      
      fetchBatch();
    }, 500); // Debounce delay
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [visibleStocks, selectedSector, selectedRisk, marketCapFilter]);

  const StockRow = memo(({ stock, isInWatchlist, onToggleWatchlist }: { 
    stock: Stock; 
    isInWatchlist: boolean;
    onToggleWatchlist: (symbol: string, companyName: string) => void;
  }) => {
    if (!stock || !stock.symbol) return null;
    
    const price = Number(stock.price) || 0;
    const change = Number(stock.change) || 0;
    const changePercent = Number(stock.changePercent) || 0;
    const marketCap = Number(stock.marketCap) || 0;
    const volume = Number(stock.volume) || 0;
    const hasLiveData = price > 0;
    
    const handleRowClick = (e: React.MouseEvent) => {
      // Don't navigate if clicking on interactive elements
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a')) return;
      navigate(`/research?symbol=${stock.symbol}`);
    };
    
    return (
      <tr 
        className="border-b last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
        onClick={handleRowClick}
      >
        <td className="py-3 px-2">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist(stock.symbol, stock.companyName || stock.symbol);
              }}
              className="text-muted-foreground hover:text-primary transition-colors"
              title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              {isInWatchlist ? (
                <Star className="w-4 h-4 fill-primary text-primary" />
              ) : (
                <StarOff className="w-4 h-4" />
              )}
            </button>
            <Link 
              to={`/research?symbol=${stock.symbol}`} 
              className="hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-semibold text-sm">{stock.symbol}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[100px]">{stock.companyName || stock.symbol}</p>
            </Link>
          </div>
        </td>
        <td className="py-3 px-2 font-medium text-sm">
          {hasLiveData ? `$${price.toFixed(2)}` : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
        <td className={`py-3 px-2 text-sm ${change >= 0 ? 'text-primary' : 'text-destructive'}`}>
          {hasLiveData ? (
            <div className="flex items-center gap-1">
              {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="whitespace-nowrap">
                {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
        <td className="py-3 px-2 text-sm">
          {marketCap > 0 ? formatMarketCap(marketCap) : '—'}
        </td>
        <td className="py-3 px-2 text-sm">
          {volume > 0 ? formatVolume(volume) : '—'}
        </td>
        <td className="py-3 px-2 hidden md:table-cell">
          <Badge 
            variant="outline" 
            className={`text-xs ${
              hasLiveData 
                ? stock.riskLevel === 'low' 
                  ? 'border-primary/50 text-primary' 
                  : stock.riskLevel === 'high' 
                    ? 'border-destructive/50 text-destructive' 
                    : ''
                : ''
            }`}
          >
            {hasLiveData ? stock.riskLevel : '—'}
          </Badge>
        </td>
        <td className="py-3 px-2 hidden sm:table-cell">
          <Badge variant="outline" className="text-xs">{stock.sector || 'Unknown'}</Badge>
        </td>
        <td className="py-3 px-2">
          <Link 
            to={`/research?symbol=${stock.symbol}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Button size="sm" className="h-7 text-xs">Trade</Button>
          </Link>
        </td>
      </tr>
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Stock Screener & Watchlist</h1>
            <p className="text-muted-foreground">
              Search from {totalStocks.toLocaleString()} Russell 5000 stocks • 
              {watchlist?.length || 0} in your watchlist
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loadingCache || refreshCache.isPending}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshCache.isPending ? 'animate-spin' : ''}`} />
            Refresh Prices
          </Button>
        </div>

        {/* Top Gainers & Losers Section */}
        {topGainers.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flame className="w-4 h-4 text-primary" />
                  Top Gainers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {topGainers.map(stock => (
                    <Link 
                      key={stock.symbol} 
                      to={`/research?symbol=${stock.symbol}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{stock.symbol}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">{stock.companyName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">${stock.price.toFixed(2)}</span>
                        <Badge className="bg-primary/20 text-primary border-0 text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +{stock.changePercent.toFixed(2)}%
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  Top Losers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {topLosers.map(stock => (
                    <Link 
                      key={stock.symbol} 
                      to={`/research?symbol=${stock.symbol}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{stock.symbol}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">{stock.companyName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">${stock.price.toFixed(2)}</span>
                        <Badge className="bg-destructive/20 text-destructive border-0 text-xs">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {stock.changePercent.toFixed(2)}%
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Search className="w-4 h-4" />
              All Stocks
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="gap-2">
              <Eye className="w-4 h-4" />
              Watchlist ({watchlist?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Filters Card */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search ticker..." 
                      value={search} 
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setShowSuggestions(true);
                      }} 
                      onKeyDown={handleKeyDown}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="pl-10" 
                    />
                    {showSuggestions && tickerSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-60 overflow-auto">
                        {tickerSuggestions.map((ticker) => (
                          <button
                            key={ticker.symbol}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-accent flex justify-between items-center"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleTickerSearch(ticker.symbol)}
                          >
                            <span>
                              <span className="font-semibold">{ticker.symbol}</span>
                              <span className="text-muted-foreground ml-2 text-sm">{ticker.name}</span>
                            </span>
                            <Badge variant="outline" className="text-xs">{ticker.sector}</Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="secondary" 
                    size="icon"
                    onClick={() => handleTickerSearch()}
                    disabled={searchStock.isPending || !search.trim()}
                    title="Fetch live data"
                  >
                    {searchStock.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger><SelectValue placeholder="Sector" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedRisk} onValueChange={setSelectedRisk}>
                  <SelectTrigger><SelectValue placeholder="Risk Level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={marketCapFilter} onValueChange={setMarketCapFilter}>
                  <SelectTrigger><SelectValue placeholder="Market Cap" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Caps</SelectItem>
                    <SelectItem value="large">Large ($200B+)</SelectItem>
                    <SelectItem value="mid">Mid ($10B-$200B)</SelectItem>
                    <SelectItem value="small">Small (&lt;$10B)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {loadedStocksCount < (russell5000Tickers?.length || 0) ? (
                      <>
                        {loadedStocksCount.toLocaleString()} stocks loaded
                        <span className="text-sm font-normal text-muted-foreground">
                          (of {getTotalTickerCount().toLocaleString()})
                        </span>
                      </>
                    ) : (
                      <>
                        {filteredStocks.length.toLocaleString()} stocks found
                        {visibleCount < filteredStocks.length && (
                          <span className="text-sm font-normal text-muted-foreground">
                            (showing {visibleCount.toLocaleString()})
                          </span>
                        )}
                      </>
                    )}
                    {(loadingCache || isFetchingBatch || refreshCache.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                    {refreshCache.isPending && <span className="text-sm font-normal text-muted-foreground">Updating cache...</span>}
                    {isFetchingBatch && <span className="text-sm font-normal text-muted-foreground">Fetching live data...</span>}
                  </CardTitle>
                  {visibleCount > 100 && (
                    <Button variant="ghost" size="sm" onClick={scrollToTop}>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Top
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div 
                  ref={scrollRef}
                  className="overflow-auto max-h-[600px]"
                  onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    if (target.scrollHeight - target.scrollTop - target.clientHeight < 200) {
                      handleLoadMore();
                    }
                  }}
                >
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/30 sticky top-0 z-10">
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-3 px-2 font-medium bg-secondary/30">
                          <button onClick={() => handleSort('symbol')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                            Symbol
                            {sortColumn === 'symbol' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                          </button>
                        </th>
                        <th className="py-3 px-2 font-medium bg-secondary/30">
                          <button onClick={() => handleSort('price')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                            Price
                            {sortColumn === 'price' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                          </button>
                        </th>
                        <th className="py-3 px-2 font-medium bg-secondary/30">
                          <button onClick={() => handleSort('changePercent')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                            Change
                            {sortColumn === 'changePercent' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                          </button>
                        </th>
                        <th className="py-3 px-2 font-medium bg-secondary/30">
                          <button onClick={() => handleSort('marketCap')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                            Mkt Cap
                            {sortColumn === 'marketCap' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                          </button>
                        </th>
                        <th className="py-3 px-2 font-medium bg-secondary/30">
                          <button onClick={() => handleSort('volume')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                            Volume
                            {sortColumn === 'volume' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                          </button>
                        </th>
                        <th className="py-3 px-2 font-medium hidden md:table-cell bg-secondary/30">
                          <button onClick={() => handleSort('riskLevel')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                            Risk
                            {sortColumn === 'riskLevel' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                          </button>
                        </th>
                        <th className="py-3 px-2 font-medium hidden sm:table-cell bg-secondary/30">Sector</th>
                        <th className="py-3 px-2 font-medium bg-secondary/30">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleStocks.map(stock => (
                        <StockRow 
                          key={stock.symbol} 
                          stock={stock}
                          isInWatchlist={isInWatchlist(stock.symbol)}
                          onToggleWatchlist={handleToggleWatchlist}
                        />
                      ))}
                    </tbody>
                  </table>
                  {(visibleCount < filteredStocks.length || loadedStocksCount < (russell5000Tickers?.length || 0)) && (
                    <div className="py-4 text-center">
                      <Button variant="outline" onClick={handleLoadMore} disabled={isFetchingBatch}>
                        {isFetchingBatch ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            Load More
                            {loadedStocksCount < (russell5000Tickers?.length || 0) && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({loadedStocksCount.toLocaleString()} / {getTotalTickerCount().toLocaleString()})
                              </span>
                            )}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="watchlist" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Your Watchlist ({filteredStocks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filteredStocks.length > 0 ? (
                  <div className="overflow-auto max-h-[600px]">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/30 sticky top-0 z-10">
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-3 px-2 font-medium bg-secondary/30">
                            <button onClick={() => handleSort('symbol')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                              Symbol
                              {sortColumn === 'symbol' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                            </button>
                          </th>
                          <th className="py-3 px-2 font-medium bg-secondary/30">
                            <button onClick={() => handleSort('price')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                              Price
                              {sortColumn === 'price' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                            </button>
                          </th>
                          <th className="py-3 px-2 font-medium bg-secondary/30">
                            <button onClick={() => handleSort('changePercent')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                              Change
                              {sortColumn === 'changePercent' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                            </button>
                          </th>
                          <th className="py-3 px-2 font-medium bg-secondary/30">
                            <button onClick={() => handleSort('marketCap')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                              Mkt Cap
                              {sortColumn === 'marketCap' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                            </button>
                          </th>
                          <th className="py-3 px-2 font-medium bg-secondary/30">
                            <button onClick={() => handleSort('volume')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                              Volume
                              {sortColumn === 'volume' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                            </button>
                          </th>
                          <th className="py-3 px-2 font-medium hidden md:table-cell bg-secondary/30">
                            <button onClick={() => handleSort('riskLevel')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                              Risk
                              {sortColumn === 'riskLevel' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                            </button>
                          </th>
                          <th className="py-3 px-2 font-medium hidden sm:table-cell bg-secondary/30">Sector</th>
                          <th className="py-3 px-2 font-medium bg-secondary/30">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStocks.map(stock => (
                          <StockRow 
                            key={stock.symbol} 
                            stock={stock}
                            isInWatchlist={isInWatchlist(stock.symbol)}
                            onToggleWatchlist={handleToggleWatchlist}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 px-4">
                    <Star className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-lg font-semibold mb-2">No stocks in watchlist</h3>
                    <p className="text-muted-foreground mb-4">
                      Click the star icon on any stock to add it to your watchlist
                    </p>
                    <Button variant="outline" onClick={() => setActiveTab('all')}>
                      Browse Stocks
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ScreenerPage;
