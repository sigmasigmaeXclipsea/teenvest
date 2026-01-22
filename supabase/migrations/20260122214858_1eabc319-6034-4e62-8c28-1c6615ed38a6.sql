-- Drop and recreate leaderboard function with new return type
DROP FUNCTION IF EXISTS public.get_leaderboard();

CREATE FUNCTION public.get_leaderboard()
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  total_value NUMERIC,
  gain_percent NUMERIC,
  rank INTEGER,
  profile_public BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH portfolio_values AS (
    SELECT 
      p.user_id,
      pr.display_name,
      pr.starting_balance,
      pr.profile_public,
      p.cash_balance + COALESCE(
        (SELECT SUM(h.shares * h.average_cost) FROM holdings h WHERE h.user_id = p.user_id), 
        0
      ) AS total_value
    FROM portfolios p
    JOIN profiles pr ON pr.user_id = p.user_id
    WHERE pr.display_name IS NOT NULL
  )
  SELECT 
    pv.user_id,
    COALESCE(pv.display_name, 'Anonymous')::TEXT,
    ROUND(pv.total_value, 2),
    ROUND(((pv.total_value - pv.starting_balance) / pv.starting_balance) * 100, 2),
    ROW_NUMBER() OVER (ORDER BY pv.total_value DESC)::INTEGER,
    pv.profile_public
  FROM portfolio_values pv
  ORDER BY pv.total_value DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;