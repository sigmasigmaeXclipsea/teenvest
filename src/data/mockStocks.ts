// Mock stock data - Replace with real API later
export interface Stock {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  riskLevel: 'low' | 'medium' | 'high';
  high52Week: number;
  low52Week: number;
}

export const mockStocks: Stock[] = [
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    price: 178.72,
    change: 2.34,
    changePercent: 1.33,
    volume: 52384729,
    marketCap: 2800000000000,
    sector: 'Technology',
    riskLevel: 'low',
    high52Week: 199.62,
    low52Week: 164.08,
  },
  {
    symbol: 'MSFT',
    companyName: 'Microsoft Corporation',
    price: 378.91,
    change: 4.21,
    changePercent: 1.12,
    volume: 21847293,
    marketCap: 2810000000000,
    sector: 'Technology',
    riskLevel: 'low',
    high52Week: 420.82,
    low52Week: 309.45,
  },
  {
    symbol: 'GOOGL',
    companyName: 'Alphabet Inc.',
    price: 141.80,
    change: -1.23,
    changePercent: -0.86,
    volume: 18293847,
    marketCap: 1780000000000,
    sector: 'Technology',
    riskLevel: 'medium',
    high52Week: 155.20,
    low52Week: 115.83,
  },
  {
    symbol: 'AMZN',
    companyName: 'Amazon.com Inc.',
    price: 178.25,
    change: 3.45,
    changePercent: 1.97,
    volume: 34827394,
    marketCap: 1850000000000,
    sector: 'Consumer Discretionary',
    riskLevel: 'medium',
    high52Week: 191.70,
    low52Week: 118.35,
  },
  {
    symbol: 'NVDA',
    companyName: 'NVIDIA Corporation',
    price: 495.22,
    change: 12.87,
    changePercent: 2.67,
    volume: 41928374,
    marketCap: 1220000000000,
    sector: 'Technology',
    riskLevel: 'high',
    high52Week: 502.66,
    low52Week: 222.97,
  },
  {
    symbol: 'TSLA',
    companyName: 'Tesla Inc.',
    price: 248.50,
    change: -5.67,
    changePercent: -2.23,
    volume: 98273649,
    marketCap: 790000000000,
    sector: 'Consumer Discretionary',
    riskLevel: 'high',
    high52Week: 299.29,
    low52Week: 152.37,
  },
  {
    symbol: 'META',
    companyName: 'Meta Platforms Inc.',
    price: 326.49,
    change: 7.82,
    changePercent: 2.45,
    volume: 15283746,
    marketCap: 840000000000,
    sector: 'Technology',
    riskLevel: 'medium',
    high52Week: 342.92,
    low52Week: 196.25,
  },
  {
    symbol: 'JNJ',
    companyName: 'Johnson & Johnson',
    price: 156.74,
    change: 0.45,
    changePercent: 0.29,
    volume: 6827394,
    marketCap: 380000000000,
    sector: 'Healthcare',
    riskLevel: 'low',
    high52Week: 175.97,
    low52Week: 144.95,
  },
  {
    symbol: 'V',
    companyName: 'Visa Inc.',
    price: 259.31,
    change: 1.89,
    changePercent: 0.73,
    volume: 5928374,
    marketCap: 530000000000,
    sector: 'Financials',
    riskLevel: 'low',
    high52Week: 274.78,
    low52Week: 221.81,
  },
  {
    symbol: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    price: 171.62,
    change: 2.34,
    changePercent: 1.38,
    volume: 8293847,
    marketCap: 495000000000,
    sector: 'Financials',
    riskLevel: 'medium',
    high52Week: 172.96,
    low52Week: 128.89,
  },
  {
    symbol: 'UNH',
    companyName: 'UnitedHealth Group Inc.',
    price: 527.89,
    change: -3.21,
    changePercent: -0.60,
    volume: 2918273,
    marketCap: 490000000000,
    sector: 'Healthcare',
    riskLevel: 'low',
    high52Week: 558.10,
    low52Week: 445.68,
  },
  {
    symbol: 'XOM',
    companyName: 'Exxon Mobil Corporation',
    price: 104.56,
    change: 1.23,
    changePercent: 1.19,
    volume: 12837465,
    marketCap: 420000000000,
    sector: 'Energy',
    riskLevel: 'medium',
    high52Week: 120.70,
    low52Week: 95.77,
  },
  {
    symbol: 'PG',
    companyName: 'Procter & Gamble Co.',
    price: 152.34,
    change: 0.67,
    changePercent: 0.44,
    volume: 5827394,
    marketCap: 358000000000,
    sector: 'Consumer Staples',
    riskLevel: 'low',
    high52Week: 161.05,
    low52Week: 140.34,
  },
  {
    symbol: 'MA',
    companyName: 'Mastercard Inc.',
    price: 417.23,
    change: 3.45,
    changePercent: 0.83,
    volume: 2918374,
    marketCap: 390000000000,
    sector: 'Financials',
    riskLevel: 'low',
    high52Week: 432.95,
    low52Week: 342.46,
  },
  {
    symbol: 'HD',
    companyName: 'The Home Depot Inc.',
    price: 345.67,
    change: -2.34,
    changePercent: -0.67,
    volume: 3928374,
    marketCap: 345000000000,
    sector: 'Consumer Discretionary',
    riskLevel: 'medium',
    high52Week: 391.87,
    low52Week: 274.26,
  },
];

export const sectors = [
  'Technology',
  'Healthcare',
  'Financials',
  'Consumer Discretionary',
  'Consumer Staples',
  'Energy',
  'Industrials',
  'Materials',
  'Utilities',
  'Real Estate',
];

export const getStockBySymbol = (symbol: string): Stock | undefined => {
  return mockStocks.find(s => s.symbol === symbol);
};

export const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  }
  if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  }
  if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  }
  return `$${marketCap.toLocaleString()}`;
};

export const formatVolume = (volume: number): string => {
  if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`;
  }
  if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`;
  }
  return volume.toLocaleString();
};
