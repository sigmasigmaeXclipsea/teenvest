-- Fix ambiguous column name by using table alias
DROP FUNCTION IF EXISTS public.get_leaderboard();

CREATE FUNCTION public.get_leaderboard()
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  total_value NUMERIC,
  gain_percent NUMERIC,
  rank INTEGER,
  profile_public BOOLEAN,
  is_current_user BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT
      p.user_id,
      COALESCE(p.display_name, 'Anonymous')::TEXT AS display_name,
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
      )::INTEGER AS user_rank,
      p.profile_public,
      (p.user_id = auth.uid()) AS is_current_user
    FROM public.profiles p
    LEFT JOIN public.portfolios port ON p.user_id = port.user_id
    WHERE p.display_name IS NOT NULL
  )
  SELECT 
    ru.user_id,
    ru.display_name,
    ru.total_value,
    ru.gain_percent,
    ru.user_rank AS rank,
    ru.profile_public,
    ru.is_current_user
  FROM ranked_users ru
  WHERE ru.user_rank <= 10 OR ru.is_current_user = true
  ORDER BY ru.user_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;