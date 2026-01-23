-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage cache" ON public.stock_cache;

-- The service role key bypasses RLS entirely, so we don't need an INSERT/UPDATE policy
-- The edge function will use the service role key to update the cache