-- Fix: Remove overly permissive stock_cache write policy
-- The edge function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- So we only need the existing SELECT policy for public reads

DROP POLICY IF EXISTS "Service role can manage cache" ON public.stock_cache;