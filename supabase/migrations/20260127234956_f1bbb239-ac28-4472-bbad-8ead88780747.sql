-- Drop and recreate get_leaderboard function to return top 100
DROP FUNCTION IF EXISTS public.get_leaderboard();

CREATE FUNCTION public.get_leaderboard()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  total_value numeric,
  gain_percent numeric,
  rank bigint,
  profile_public boolean,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  RETURN QUERY
  WITH last_prices AS (
    -- Get the most recent trade price for each symbol
    SELECT DISTINCT ON (t.symbol)
      t.symbol,
      t.price
    FROM trades t
    ORDER BY t.symbol, t.created_at DESC
  ),
  user_holdings_value AS (
    -- Calculate holdings value per user using last trade prices
    SELECT 
      h.user_id,
      COALESCE(SUM(h.shares * lp.price), 0) as holdings_value
    FROM holdings h
    LEFT JOIN last_prices lp ON h.symbol = lp.symbol
    GROUP BY h.user_id
  ),
  ranked_users AS (
    SELECT 
      p.user_id,
      COALESCE(p.display_name, 'Anonymous') as display_name,
      (COALESCE(port.cash_balance, 10000) + COALESCE(uhv.holdings_value, 0)) as total_value,
      p.starting_balance,
      p.profile_public,
      ROW_NUMBER() OVER (
        ORDER BY 
          ((COALESCE(port.cash_balance, 10000) + COALESCE(uhv.holdings_value, 0) - p.starting_balance) / NULLIF(p.starting_balance, 0)) DESC,
          (COALESCE(port.cash_balance, 10000) + COALESCE(uhv.holdings_value, 0)) DESC
      ) as rank
    FROM profiles p
    LEFT JOIN portfolios port ON p.user_id = port.user_id
    LEFT JOIN user_holdings_value uhv ON p.user_id = uhv.user_id
  )
  SELECT 
    ru.user_id,
    ru.display_name,
    ru.total_value,
    ROUND(((ru.total_value - ru.starting_balance) / NULLIF(ru.starting_balance, 0)) * 100, 2) as gain_percent,
    ru.rank,
    ru.profile_public,
    (ru.user_id = current_user_id) as is_current_user
  FROM ranked_users ru
  WHERE ru.rank <= 100
     OR ru.user_id = current_user_id
  ORDER BY ru.rank;
END;
$$;