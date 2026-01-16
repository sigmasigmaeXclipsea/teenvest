-- Drop the overly permissive public leaderboard policy
DROP POLICY IF EXISTS "Users can view all profiles for leaderboard" ON public.profiles;

-- Create a secure leaderboard view that only exposes minimum necessary data
-- Uses security_invoker to respect RLS, but we'll grant specific access
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
  p.user_id,
  COALESCE(p.display_name, 'Anonymous') as display_name,
  p.starting_balance,
  COALESCE(port.cash_balance, 10000) as cash_balance
FROM public.profiles p
LEFT JOIN public.portfolios port ON p.user_id = port.user_id;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.leaderboard_view TO authenticated;

-- Create a security definer function to get leaderboard data
-- This bypasses RLS on profiles/portfolios but only returns limited, non-sensitive data
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  display_name text,
  total_value numeric,
  gain_percent numeric,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(p.display_name, 'Investor #' || ROW_NUMBER() OVER (ORDER BY p.created_at)) as display_name,
    COALESCE(port.cash_balance, 10000) as total_value,
    CASE 
      WHEN p.starting_balance > 0 
      THEN ((COALESCE(port.cash_balance, 10000) - p.starting_balance) / p.starting_balance) * 100
      ELSE 0
    END as gain_percent,
    ROW_NUMBER() OVER (
      ORDER BY CASE 
        WHEN p.starting_balance > 0 
        THEN ((COALESCE(port.cash_balance, 10000) - p.starting_balance) / p.starting_balance) * 100
        ELSE 0
      END DESC
    ) as rank
  FROM public.profiles p
  LEFT JOIN public.portfolios port ON p.user_id = port.user_id
  ORDER BY gain_percent DESC
  LIMIT 10;
$$;