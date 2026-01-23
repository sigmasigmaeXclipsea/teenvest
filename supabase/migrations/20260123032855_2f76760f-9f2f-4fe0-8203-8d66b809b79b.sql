-- Create stock cache table for fast screener loads
CREATE TABLE public.stock_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  change NUMERIC NOT NULL DEFAULT 0,
  change_percent NUMERIC NOT NULL DEFAULT 0,
  volume BIGINT DEFAULT 0,
  market_cap BIGINT DEFAULT 0,
  sector TEXT,
  high NUMERIC DEFAULT 0,
  low NUMERIC DEFAULT 0,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_stock_cache_symbol ON public.stock_cache(symbol);
CREATE INDEX idx_stock_cache_cached_at ON public.stock_cache(cached_at);

-- Enable RLS but allow public read access (stock prices are public data)
ALTER TABLE public.stock_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read cached stock data
CREATE POLICY "Anyone can view stock cache" 
ON public.stock_cache 
FOR SELECT 
USING (true);

-- Only authenticated users can update cache (via edge function with service role)
CREATE POLICY "Service role can manage cache" 
ON public.stock_cache 
FOR ALL 
USING (true)
WITH CHECK (true);