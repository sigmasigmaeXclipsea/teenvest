-- Update leaderboard to track cash growth efficiently
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
  SELECT
    p.user_id,
    COALESCE(p.display_name, 'Anonymous')::TEXT,
    COALESCE(port.cash_balance, p.starting_balance) AS total_value,
    CASE
      WHEN p.starting_balance > 0
        THEN ROUND(((COALESCE(port.cash_balance, p.starting_balance) - p.starting_balance) / p.starting_balance) * 100, 2)
      ELSE 0
    END AS gain_percent,
    ROW_NUMBER() OVER (
      ORDER BY
        CASE
          WHEN p.starting_balance > 0
            THEN ((COALESCE(port.cash_balance, p.starting_balance) - p.starting_balance) / p.starting_balance)
          ELSE 0
        END DESC,
        COALESCE(port.cash_balance, p.starting_balance) DESC
    )::INTEGER,
    p.profile_public
  FROM public.profiles p
  LEFT JOIN public.portfolios port ON p.user_id = port.user_id
  WHERE p.display_name IS NOT NULL
  ORDER BY gain_percent DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;