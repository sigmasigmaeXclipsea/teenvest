-- Add margin trading support to execute_trade

CREATE OR REPLACE FUNCTION public.execute_trade(
  p_user_id UUID,
  p_symbol TEXT,
  p_company_name TEXT,
  p_trade_type TEXT,
  p_order_type TEXT,
  p_shares NUMERIC,
  p_price NUMERIC,
  p_sector TEXT DEFAULT NULL,
  p_prediction_direction TEXT DEFAULT NULL,
  p_prediction_thesis TEXT DEFAULT NULL,
  p_prediction_indicators JSONB DEFAULT '[]'::jsonb,
  p_prediction_target NUMERIC DEFAULT NULL,
  p_prediction_horizon_at TIMESTAMPTZ DEFAULT NULL,
  p_allow_margin BOOLEAN DEFAULT false,
  p_margin_multiplier NUMERIC DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_portfolio portfolios%ROWTYPE;
  v_holding holdings%ROWTYPE;
  v_total_amount NUMERIC;
  v_new_shares NUMERIC;
  v_new_avg_cost NUMERIC;
  v_trade_id UUID;
  v_entry_price NUMERIC;
  v_short_shares NUMERIC;
  v_buying_power NUMERIC;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_total_amount := p_shares * p_price;

  SELECT * INTO v_portfolio
  FROM portfolios
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portfolio not found for user';
  END IF;

  v_buying_power := v_portfolio.cash_balance * GREATEST(p_margin_multiplier, 1);

  IF p_trade_type = 'buy' THEN
    IF v_portfolio.cash_balance < v_total_amount THEN
      IF NOT p_allow_margin OR v_total_amount > v_buying_power THEN
        RAISE EXCEPTION 'Insufficient funds';
      END IF;
    END IF;

    SELECT * INTO v_holding
    FROM holdings
    WHERE user_id = p_user_id AND symbol = p_symbol
    FOR UPDATE;

    IF FOUND AND v_holding.shares < 0 THEN
      RAISE EXCEPTION 'Cannot buy while short. Use cover instead.';
    END IF;

    UPDATE portfolios
    SET cash_balance = cash_balance - v_total_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    IF FOUND THEN
      v_new_shares := v_holding.shares + p_shares;
      v_new_avg_cost := ((v_holding.shares * v_holding.average_cost) + v_total_amount) / v_new_shares;

      UPDATE holdings
      SET shares = v_new_shares,
          average_cost = v_new_avg_cost,
          updated_at = now()
      WHERE id = v_holding.id;
    ELSE
      INSERT INTO holdings (user_id, symbol, company_name, shares, average_cost, sector)
      VALUES (p_user_id, p_symbol, p_company_name, p_shares, p_price, p_sector);
    END IF;

  ELSIF p_trade_type = 'sell' THEN
    SELECT * INTO v_holding
    FROM holdings
    WHERE user_id = p_user_id AND symbol = p_symbol
    FOR UPDATE;

    IF NOT FOUND OR v_holding.shares <= 0 THEN
      RAISE EXCEPTION 'No holding found for this symbol';
    END IF;

    IF v_holding.shares < p_shares THEN
      RAISE EXCEPTION 'Insufficient shares';
    END IF;

    v_entry_price := v_holding.average_cost;

    UPDATE portfolios
    SET cash_balance = cash_balance + v_total_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    v_new_shares := v_holding.shares - p_shares;

    IF v_new_shares = 0 THEN
      DELETE FROM holdings WHERE id = v_holding.id;
    ELSE
      UPDATE holdings
      SET shares = v_new_shares,
          updated_at = now()
      WHERE id = v_holding.id;
    END IF;

  ELSIF p_trade_type = 'short' THEN
    SELECT * INTO v_holding
    FROM holdings
    WHERE user_id = p_user_id AND symbol = p_symbol
    FOR UPDATE;

    IF FOUND AND v_holding.shares > 0 THEN
      RAISE EXCEPTION 'Close long position before shorting';
    END IF;

    UPDATE portfolios
    SET cash_balance = cash_balance + v_total_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    IF FOUND THEN
      v_short_shares := ABS(v_holding.shares);
      v_new_shares := v_holding.shares - p_shares;
      v_new_avg_cost := ((v_short_shares * v_holding.average_cost) + v_total_amount) / ABS(v_new_shares);

      UPDATE holdings
      SET shares = v_new_shares,
          average_cost = v_new_avg_cost,
          updated_at = now()
      WHERE id = v_holding.id;
    ELSE
      INSERT INTO holdings (user_id, symbol, company_name, shares, average_cost, sector)
      VALUES (p_user_id, p_symbol, p_company_name, -p_shares, p_price, p_sector);
    END IF;

  ELSIF p_trade_type = 'cover' THEN
    SELECT * INTO v_holding
    FROM holdings
    WHERE user_id = p_user_id AND symbol = p_symbol
    FOR UPDATE;

    IF NOT FOUND OR v_holding.shares >= 0 THEN
      RAISE EXCEPTION 'No short position found for this symbol';
    END IF;

    IF ABS(v_holding.shares) < p_shares THEN
      RAISE EXCEPTION 'Insufficient shares';
    END IF;

    IF v_portfolio.cash_balance < v_total_amount THEN
      IF NOT p_allow_margin OR v_total_amount > v_buying_power THEN
        RAISE EXCEPTION 'Insufficient funds';
      END IF;
    END IF;

    v_entry_price := v_holding.average_cost;

    UPDATE portfolios
    SET cash_balance = cash_balance - v_total_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    v_new_shares := v_holding.shares + p_shares;

    IF v_new_shares = 0 THEN
      DELETE FROM holdings WHERE id = v_holding.id;
    ELSE
      UPDATE holdings
      SET shares = v_new_shares,
          updated_at = now()
      WHERE id = v_holding.id;
    END IF;

  ELSE
    RAISE EXCEPTION 'Invalid trade type: %', p_trade_type;
  END IF;

  INSERT INTO trades (
    user_id,
    symbol,
    company_name,
    trade_type,
    order_type,
    shares,
    price,
    total_amount,
    status,
    sector,
    executed_price,
    filled_at,
    prediction_direction,
    prediction_thesis,
    prediction_indicators,
    prediction_target,
    prediction_horizon_at,
    entry_price
  )
  VALUES (
    p_user_id,
    p_symbol,
    p_company_name,
    p_trade_type,
    p_order_type,
    p_shares,
    p_price,
    v_total_amount,
    'completed',
    p_sector,
    p_price,
    now(),
    p_prediction_direction,
    p_prediction_thesis,
    COALESCE(p_prediction_indicators, '[]'::jsonb),
    p_prediction_target,
    p_prediction_horizon_at,
    v_entry_price
  )
  RETURNING id INTO v_trade_id;

  RETURN json_build_object(
    'success', true,
    'trade_id', v_trade_id,
    'total_amount', v_total_amount
  );
END;
$$;
