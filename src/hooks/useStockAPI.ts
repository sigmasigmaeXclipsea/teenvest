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
}

interface APIResponse {
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
}

const fetchStockQuote = async (symbol: string): Promise<StockQuote> => {
  const response = await fetch(`${API_BASE_URL}/${symbol.toUpperCase()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch stock data for ${symbol}`);
  }
  
  const data: APIResponse = await response.json();
  
  // Calculate risk level based on change percent volatility
  const absChangePercent = Math.abs(data.changePercent);
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  if (absChangePercent < 1) riskLevel = 'low';
  else if (absChangePercent > 3) riskLevel = 'high';
  
  return {
    symbol: data.symbol,
    companyName: data.companyName || data.name || data.symbol,
    price: data.price,
    change: data.change,
    changePercent: data.changePercent,
    high: data.high,
    low: data.low,
    open: data.open,
    previousClose: data.previousClose,
    volume: data.volume,
    marketCap: data.marketCap,
    riskLevel,
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
