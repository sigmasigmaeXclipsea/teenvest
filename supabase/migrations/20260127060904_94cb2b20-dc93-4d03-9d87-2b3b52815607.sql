-- Update leaderboard to rank by total portfolio value (cash + holdings at last trade price)

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
  WITH last_prices AS (
    SELECT
      t.user_id,
      t.symbol,
      t.price,
      ROW_NUMBER() OVER (PARTITION BY t.user_id, t.symbol ORDER BY t.created_at DESC) AS rn
    FROM public.trades t
  ),
  holdings_value AS (
    SELECT
      h.user_id,
      COALESCE(SUM(h.shares * COALESCE(lp.price, h.average_cost)), 0) AS holdings_value
    FROM public.holdings h
    LEFT JOIN last_prices lp
      ON lp.user_id = h.user_id
     AND lp.symbol = h.symbol
     AND lp.rn = 1
    GROUP BY h.user_id
  ),
  ranked_users AS (
    SELECT
      p.user_id,
      COALESCE(p.display_name, 'Anonymous')::TEXT AS display_name,
      COALESCE(port.cash_balance, p.starting_balance) AS cash_balance,
      COALESCE(hv.holdings_value, 0) AS holdings_value,
      p.starting_balance,
      p.profile_public,
      (p.user_id = auth.uid()) AS is_current_user
    FROM public.profiles p
    LEFT JOIN public.portfolios port ON p.user_id = port.user_id
    LEFT JOIN holdings_value hv ON hv.user_id = p.user_id
    WHERE p.display_name IS NOT NULL
  ),
  ranked_with_values AS (
    SELECT
      ru.user_id,
      ru.display_name,
      (ru.cash_balance + ru.holdings_value) AS total_value,
      CASE
        WHEN ru.starting_balance > 0
          THEN ROUND((((ru.cash_balance + ru.holdings_value) - ru.starting_balance) / ru.starting_balance) * 100, 2)
        ELSE 0
      END AS gain_percent,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE
            WHEN ru.starting_balance > 0
              THEN (((ru.cash_balance + ru.holdings_value) - ru.starting_balance) / ru.starting_balance)
            ELSE 0
          END DESC,
          (ru.cash_balance + ru.holdings_value) DESC
      )::INTEGER AS user_rank,
      ru.profile_public,
      ru.is_current_user
    FROM ranked_users ru
  )
  SELECT
    rw.user_id,
    rw.display_name,
    rw.total_value,
    rw.gain_percent,
    rw.user_rank AS rank,
    rw.profile_public,
    rw.is_current_user
  FROM ranked_with_values rw
  WHERE rw.user_rank <= 10 OR rw.is_current_user = true
  ORDER BY rw.user_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;