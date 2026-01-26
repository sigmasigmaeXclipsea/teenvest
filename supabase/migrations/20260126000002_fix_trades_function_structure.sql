-- Fix get_recent_platform_trades function structure mismatch
-- Drop and recreate to ensure clean state

DROP FUNCTION IF EXISTS public.get_recent_platform_trades(integer);

CREATE FUNCTION public.get_recent_platform_trades(_limit integer DEFAULT 50)
RETURNS TABLE(
  id uuid, 
  user_email text, 
  user_name text,
  symbol text, 
  trade_type text, 
  shares numeric, 
  price numeric, 
  total_amount numeric, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin or owner
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_owner(auth.uid())) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    t.id::uuid,
    COALESCE(u.email::text, 'unknown')::text,
    COALESCE(p.display_name::text, u.email::text, 'Unknown User')::text,
    t.symbol::text,
    t.trade_type::text,
    t.shares::numeric,
    t.price::numeric,
    COALESCE(t.total_amount, (t.shares * t.price))::numeric,
    t.created_at
  FROM public.trades t
  JOIN auth.users u ON t.user_id = u.id
  LEFT JOIN public.profiles p ON t.user_id = p.user_id
  ORDER BY t.created_at DESC
  LIMIT _limit;
END;
$$;
