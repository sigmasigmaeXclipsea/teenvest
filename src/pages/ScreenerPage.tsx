import { useState, useMemo } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { formatMarketCap, formatVolume, Stock } from '@/data/mockStocks';
import { russell5000Tickers, searchTickers, getAllSectors, getTotalTickerCount, getTickerInfo } from '@/data/russell5000Tickers';
import { Link } from 'react-router-dom';
import { useSearchStock, StockQuote } from '@/hooks/useStockAPI';
import { useToast } from '@/hooks/use-toast';

const ScreenerPage = () => {
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [priceRange, setPriceRange] = useState([0, 600]);
  const [marketCapFilter, setMarketCapFilter] = useState<string>('all');
  const [searchedStocks, setSearchedStocks] = useState<StockQuote[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchStock = useSearchStock();
  const { toast } = useToast();
  
  const sectors = getAllSectors();
  const totalStocks = getTotalTickerCount();

  // Get ticker suggestions based on search
  const tickerSuggestions = useMemo(() => {
    if (search.length < 1) return [];
    return searchTickers(search).slice(0, 10);
  }, [search]);

  const handleTickerSearch = async (ticker?: string) => {
    const symbolToSearch = ticker || search.trim().toUpperCase();
    if (!symbolToSearch) return;
    
    // Don't search if already in searched stocks
    if (searchedStocks.some(s => s.symbol === symbolToSearch)) {
      setShowSuggestions(false);
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

  // Convert Russell 5000 tickers to Stock format for display (showing base info)
  const russellStocksAsBase: Stock[] = useMemo(() => {
    return russell5000Tickers.map(t => ({
      symbol: t.symbol,
      companyName: t.name,
      price: 0, // Will be fetched on demand
      change: 0,
      changePercent: 0,
      volume: 0,
      marketCap: 0,
      sector: t.sector,
      riskLevel: 'medium' as const,
      high52Week: 0,
      low52Week: 0,
    }));
  }, []);

  // Combine searched stocks (with live data) with Russell 5000 base data
  const allStocks = useMemo(() => {
    const searchedAsStock: Stock[] = searchedStocks.map(s => ({
      symbol: s.symbol,
      companyName: s.companyName,
      price: s.price,
      change: s.change,
      changePercent: s.changePercent,
      volume: s.volume || 0,
      marketCap: s.marketCap || 0,
      sector: s.sector || getTickerInfo(s.symbol)?.sector || 'Unknown',
      riskLevel: s.riskLevel || 'medium',
      high52Week: s.high,
      low52Week: s.low,
    }));
    
    // Filter out any Russell stocks that are now in searched (to show live data)
    const filteredRussell = russellStocksAsBase.filter(
      m => !searchedStocks.some(s => s.symbol === m.symbol)
    );
    
    return [...searchedAsStock, ...filteredRussell];
  }, [searchedStocks, russellStocksAsBase]);

  const filteredStocks = useMemo(() => {
    return allStocks.filter(stock => {
      const matchesSearch = stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
        stock.companyName.toLowerCase().includes(search.toLowerCase());
      const matchesSector = selectedSector === 'all' || stock.sector === selectedSector;
      const matchesRisk = selectedRisk === 'all' || stock.riskLevel === selectedRisk;
      
      // Only apply price filter to stocks with live data
      const hasLiveData = stock.price > 0;
      const matchesPrice = !hasLiveData || (stock.price >= priceRange[0] && stock.price <= priceRange[1]);
      
      let matchesMarketCap = true;
      if (hasLiveData && marketCapFilter !== 'all') {
        if (marketCapFilter === 'large') matchesMarketCap = stock.marketCap >= 200e9;
        else if (marketCapFilter === 'mid') matchesMarketCap = stock.marketCap >= 10e9 && stock.marketCap < 200e9;
        else if (marketCapFilter === 'small') matchesMarketCap = stock.marketCap < 10e9;
      }

      return matchesSearch && matchesSector && matchesRisk && matchesPrice && matchesMarketCap;
    }).slice(0, 100); // Limit display to 100 for performance
  }, [search, selectedSector, selectedRisk, priceRange, marketCapFilter, allStocks]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Stock Screener</h1>
          <p className="text-muted-foreground">
            Search from {totalStocks.toLocaleString()} Russell 5000 stocks with live data
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Filter className="w-5 h-5" />Filters</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search ticker or company..." 
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
                  {/* Suggestions dropdown */}
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
                  <SelectItem value="large">Large Cap ($200B+)</SelectItem>
                  <SelectItem value="mid">Mid Cap ($10B-$200B)</SelectItem>
                  <SelectItem value="small">Small Cap (&lt;$10B)</SelectItem>
                </SelectContent>
              </Select>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Price: ${priceRange[0]} - ${priceRange[1]} (live data only)</p>
                <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={600} step={10} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredStocks.length} stocks shown 
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Click search to fetch live prices)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Symbol</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Change</th>
                    <th className="pb-3 font-medium hidden md:table-cell">Market Cap</th>
                    <th className="pb-3 font-medium hidden lg:table-cell">Volume</th>
                    <th className="pb-3 font-medium">Sector</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map(stock => (
                    <tr key={stock.symbol} className="border-b last:border-0">
                      <td className="py-4">
                        <p className="font-semibold">{stock.symbol}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[150px]">{stock.companyName}</p>
                      </td>
                      <td className="py-4 font-medium">
                        {stock.price > 0 ? `$${stock.price.toFixed(2)}` : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className={`py-4 ${stock.change >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {stock.price > 0 ? (
                          <div className="flex items-center gap-1">
                            {stock.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {stock.changePercent.toFixed(2)}%
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="py-4 hidden md:table-cell">
                        {stock.marketCap > 0 ? formatMarketCap(stock.marketCap) : '—'}
                      </td>
                      <td className="py-4 hidden lg:table-cell">
                        {stock.volume > 0 ? formatVolume(stock.volume) : '—'}
                      </td>
                      <td className="py-4">
                        <Badge variant="outline">{stock.sector}</Badge>
                      </td>
                      <td className="py-4">
                        <Link to={`/trade?symbol=${stock.symbol}`}>
                          <Button size="sm">Trade</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ScreenerPage;
