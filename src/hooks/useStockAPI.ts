import { useQuery, useMutation } from '@tanstack/react-query';

const API_BASE_URL = 'https://finnhub-stock-api-5xrj.onrender.com/api/stock';

export interface StockQuote {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume?: number;
  marketCap?: number;
  sector?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  logo?: string;
  country?: string;
  exchange?: string;
  ipo?: string;
  weburl?: string;
  shareOutstanding?: number;
}

// The backend may return either a flat payload OR the Finnhub-style shape:
// { quote: { c,d,dp,h,l,o,pc,v? }, profile: { name,ticker,marketCapitalization,shareOutstanding,finnhubIndustry } }
type APIResponse =
  | {
      symbol: string;
      companyName?: string;
      name?: string;
      price: number;
      change: number;
      changePercent: number;
      high: number;
      low: number;
      open: number;
      previousClose: number;
      volume?: number;
      marketCap?: number;
      sector?: string;
    }
  | {
      quote?: {
        c?: number;
        d?: number | null;
        dp?: number | null;
        h?: number;
        l?: number;
        o?: number;
        pc?: number;
        v?: number;
        t?: number;
      };
      profile?: {
        name?: string;
        ticker?: string;
        marketCapitalization?: number; // typically in millions
        shareOutstanding?: number;
        finnhubIndustry?: string;
        logo?: string;
        country?: string;
        exchange?: string;
        ipo?: string;
        weburl?: string;
      };
      symbol?: string;
      cached?: boolean;
    };

const toNumber = (value: unknown, fallback = 0) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const fetchStockQuote = async (symbol: string): Promise<StockQuote> => {
  const safeSymbol = (symbol || '').trim().toUpperCase();
  if (!safeSymbol) throw new Error('Symbol is required');

  const response = await fetch(`${API_BASE_URL}/${safeSymbol}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch stock data for ${safeSymbol}`);
  }
  
  const data: APIResponse = await response.json();

  // Normalize the response shape into our StockQuote.
  const isFinnhubShape = typeof (data as any)?.quote === 'object' || typeof (data as any)?.profile === 'object';
  const normalized = isFinnhubShape
    ? {
        symbol: (data as any)?.profile?.ticker || (data as any)?.symbol || safeSymbol,
        companyName: (data as any)?.profile?.name || safeSymbol,
        price: toNumber((data as any)?.quote?.c, 0),
        change: toNumber((data as any)?.quote?.d, 0),
        changePercent: toNumber((data as any)?.quote?.dp, 0),
        high: toNumber((data as any)?.quote?.h, 0),
        low: toNumber((data as any)?.quote?.l, 0),
        open: toNumber((data as any)?.quote?.o, 0),
        previousClose: toNumber((data as any)?.quote?.pc, 0),
        volume: toNumber((data as any)?.quote?.v, 0),
        // Finnhub returns marketCapitalization in millions.
        marketCap: toNumber((data as any)?.profile?.marketCapitalization, 0) * 1_000_000,
        sector: (data as any)?.profile?.finnhubIndustry,
        logo: (data as any)?.profile?.logo,
        country: (data as any)?.profile?.country,
        exchange: (data as any)?.profile?.exchange,
        ipo: (data as any)?.profile?.ipo,
        weburl: (data as any)?.profile?.weburl,
        shareOutstanding: toNumber((data as any)?.profile?.shareOutstanding, 0),
      }
    : {
        symbol: (data as any)?.symbol || safeSymbol,
        companyName: (data as any)?.companyName || (data as any)?.name || (data as any)?.symbol || safeSymbol,
        price: toNumber((data as any)?.price, 0),
        change: toNumber((data as any)?.change, 0),
        changePercent: toNumber((data as any)?.changePercent, 0),
        high: toNumber((data as any)?.high, 0),
        low: toNumber((data as any)?.low, 0),
        open: toNumber((data as any)?.open, 0),
        previousClose: toNumber((data as any)?.previousClose, 0),
        volume: toNumber((data as any)?.volume, 0),
        marketCap: toNumber((data as any)?.marketCap, 0),
        sector: (data as any)?.sector,
      };
  
  // Calculate risk level based on change percent volatility
  const absChangePercent = Math.abs(normalized.changePercent);
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  if (absChangePercent < 1) riskLevel = 'low';
  else if (absChangePercent > 3) riskLevel = 'high';
  
  return {
    symbol: normalized.symbol,
    companyName: normalized.companyName,
    price: normalized.price,
    change: normalized.change,
    changePercent: normalized.changePercent,
    high: normalized.high,
    low: normalized.low,
    open: normalized.open,
    previousClose: normalized.previousClose,
    volume: normalized.volume,
    marketCap: normalized.marketCap,
    sector: normalized.sector,
    riskLevel,
    logo: normalized.logo,
    country: normalized.country,
    exchange: normalized.exchange,
    ipo: normalized.ipo,
    weburl: normalized.weburl,
    shareOutstanding: normalized.shareOutstanding,
  };
};

export const useStockQuote = (symbol: string) => {
  return useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => fetchStockQuote(symbol),
    enabled: !!symbol && symbol.length > 0,
    staleTime: 30000, // Cache for 30 seconds
    retry: 2,
  });
};

export const useSearchStock = () => {
  return useMutation({
    mutationFn: fetchStockQuote,
  });
};

// Fetch multiple stocks at once
export const useMultipleStockQuotes = (symbols: string[]) => {
  return useQuery({
    queryKey: ['stocks', symbols.join(',')],
    queryFn: async () => {
      const results = await Promise.allSettled(
        symbols.map(symbol => fetchStockQuote(symbol))
      );
      
      return results
        .filter((result): result is PromiseFulfilledResult<StockQuote> => result.status === 'fulfilled')
        .map(result => result.value);
    },
    enabled: symbols.length > 0,
    staleTime: 30000,
  });
};
