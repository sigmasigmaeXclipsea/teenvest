-- Enable short selling and cover trades

ALTER TABLE public.trades
  DROP CONSTRAINT IF EXISTS trades_trade_type_check;

ALTER TABLE public.trades
  ADD CONSTRAINT trades_trade_type_check
  CHECK (trade_type IN ('buy', 'sell', 'short', 'cover'));

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
  p_prediction_horizon_at TIMESTAMPTZ DEFAULT NULL
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

  IF p_trade_type = 'buy' THEN
    IF v_portfolio.cash_balance < v_total_amount THEN
      RAISE EXCEPTION 'Insufficient funds';
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
      RAISE EXCEPTION 'Insufficient funds';
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

CREATE OR REPLACE FUNCTION public.place_order(
  p_user_id UUID,
  p_symbol TEXT,
  p_company_name TEXT,
  p_trade_type TEXT,
  p_order_type TEXT,
  p_shares NUMERIC,
  p_price NUMERIC,
  p_sector TEXT DEFAULT NULL,
  p_limit_price NUMERIC DEFAULT NULL,
  p_stop_price NUMERIC DEFAULT NULL,
  p_prediction_direction TEXT DEFAULT NULL,
  p_prediction_thesis TEXT DEFAULT NULL,
  p_prediction_indicators JSONB DEFAULT '[]'::jsonb,
  p_prediction_target NUMERIC DEFAULT NULL,
  p_prediction_horizon_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trade_id UUID;
  v_requested_price NUMERIC;
  v_total_amount NUMERIC;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_trade_type NOT IN ('buy', 'sell', 'short', 'cover') THEN
    RAISE EXCEPTION 'Invalid trade type: %', p_trade_type;
  END IF;

  IF p_order_type NOT IN ('limit', 'stop') THEN
    RAISE EXCEPTION 'Invalid order type for pending order: %', p_order_type;
  END IF;

  IF p_order_type = 'limit' AND p_limit_price IS NULL THEN
    RAISE EXCEPTION 'Limit price is required for limit orders';
  END IF;

  IF p_order_type = 'stop' AND p_stop_price IS NULL THEN
    RAISE EXCEPTION 'Stop price is required for stop orders';
  END IF;

  v_requested_price := COALESCE(
    CASE WHEN p_order_type = 'limit' THEN p_limit_price END,
    CASE WHEN p_order_type = 'stop' THEN p_stop_price END,
    p_price
  );

  IF v_requested_price IS NULL OR v_requested_price <= 0 THEN
    RAISE EXCEPTION 'Invalid order price';
  END IF;

  v_total_amount := p_shares * v_requested_price;

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
    limit_price,
    stop_price,
    sector,
    prediction_direction,
    prediction_thesis,
    prediction_indicators,
    prediction_target,
    prediction_horizon_at
  )
  VALUES (
    p_user_id,
    p_symbol,
    p_company_name,
    p_trade_type,
    p_order_type,
    p_shares,
    v_requested_price,
    v_total_amount,
    'pending',
    p_limit_price,
    p_stop_price,
    p_sector,
    p_prediction_direction,
    p_prediction_thesis,
    COALESCE(p_prediction_indicators, '[]'::jsonb),
    p_prediction_target,
    p_prediction_horizon_at
  )
  RETURNING id INTO v_trade_id;

  RETURN json_build_object(
    'success', true,
    'trade_id', v_trade_id,
    'total_amount', v_total_amount
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.fill_order(
  p_trade_id UUID,
  p_executed_price NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trade trades%ROWTYPE;
  v_portfolio portfolios%ROWTYPE;
  v_holding holdings%ROWTYPE;
  v_total_amount NUMERIC;
  v_new_shares NUMERIC;
  v_new_avg_cost NUMERIC;
  v_entry_price NUMERIC;
  v_short_shares NUMERIC;
BEGIN
  SELECT * INTO v_trade
  FROM trades
  WHERE id = p_trade_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> v_trade.user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_trade.status <> 'pending' THEN
    RAISE EXCEPTION 'Order is not pending';
  END IF;

  IF p_executed_price IS NULL OR p_executed_price <= 0 THEN
    RAISE EXCEPTION 'Invalid executed price';
  END IF;

  v_total_amount := v_trade.shares * p_executed_price;

  SELECT * INTO v_portfolio
  FROM portfolios
  WHERE user_id = v_trade.user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portfolio not found for user';
  END IF;

  IF v_trade.trade_type = 'buy' THEN
    IF v_portfolio.cash_balance < v_total_amount THEN
      RAISE EXCEPTION 'Insufficient funds';
    END IF;

    SELECT * INTO v_holding
    FROM holdings
    WHERE user_id = v_trade.user_id AND symbol = v_trade.symbol
    FOR UPDATE;

    IF FOUND AND v_holding.shares < 0 THEN
      RAISE EXCEPTION 'Cannot buy while short. Use cover instead.';
    END IF;

    UPDATE portfolios
    SET cash_balance = cash_balance - v_total_amount,
        updated_at = now()
    WHERE user_id = v_trade.user_id;

    IF FOUND THEN
      v_new_shares := v_holding.shares + v_trade.shares;
      v_new_avg_cost := ((v_holding.shares * v_holding.average_cost) + v_total_amount) / v_new_shares;

      UPDATE holdings
      SET shares = v_new_shares,
          average_cost = v_new_avg_cost,
          updated_at = now()
      WHERE id = v_holding.id;
    ELSE
      INSERT INTO holdings (user_id, symbol, company_name, shares, average_cost, sector)
      VALUES (v_trade.user_id, v_trade.symbol, v_trade.company_name, v_trade.shares, p_executed_price, v_trade.sector);
    END IF;

  ELSIF v_trade.trade_type = 'sell' THEN
    SELECT * INTO v_holding
    FROM holdings
    WHERE user_id = v_trade.user_id AND symbol = v_trade.symbol
    FOR UPDATE;

    IF NOT FOUND OR v_holding.shares <= 0 THEN
      RAISE EXCEPTION 'No holding found for this symbol';
    END IF;

    IF v_holding.shares < v_trade.shares THEN
      RAISE EXCEPTION 'Insufficient shares';
    END IF;

    v_entry_price := v_holding.average_cost;

    UPDATE portfolios
    SET cash_balance = cash_balance + v_total_amount,
        updated_at = now()
    WHERE user_id = v_trade.user_id;

    v_new_shares := v_holding.shares - v_trade.shares;

    IF v_new_shares = 0 THEN
      DELETE FROM holdings WHERE id = v_holding.id;
    ELSE
      UPDATE holdings
      SET shares = v_new_shares,
          updated_at = now()
      WHERE id = v_holding.id;
    END IF;

  ELSIF v_trade.trade_type = 'short' THEN
    SELECT * INTO v_holding
    FROM holdings
    WHERE user_id = v_trade.user_id AND symbol = v_trade.symbol
    FOR UPDATE;

    IF FOUND AND v_holding.shares > 0 THEN
      RAISE EXCEPTION 'Close long position before shorting';
    END IF;

    UPDATE portfolios
    SET cash_balance = cash_balance + v_total_amount,
        updated_at = now()
    WHERE user_id = v_trade.user_id;

    IF FOUND THEN
      v_short_shares := ABS(v_holding.shares);
      v_new_shares := v_holding.shares - v_trade.shares;
      v_new_avg_cost := ((v_short_shares * v_holding.average_cost) + v_total_amount) / ABS(v_new_shares);

      UPDATE holdings
      SET shares = v_new_shares,
          average_cost = v_new_avg_cost,
          updated_at = now()
      WHERE id = v_holding.id;
    ELSE
      INSERT INTO holdings (user_id, symbol, company_name, shares, average_cost, sector)
      VALUES (v_trade.user_id, v_trade.symbol, v_trade.company_name, -v_trade.shares, p_executed_price, v_trade.sector);
    END IF;

  ELSIF v_trade.trade_type = 'cover' THEN
    SELECT * INTO v_holding
    FROM holdings
    WHERE user_id = v_trade.user_id AND symbol = v_trade.symbol
    FOR UPDATE;

    IF NOT FOUND OR v_holding.shares >= 0 THEN
      RAISE EXCEPTION 'No short position found for this symbol';
    END IF;

    IF ABS(v_holding.shares) < v_trade.shares THEN
      RAISE EXCEPTION 'Insufficient shares';
    END IF;

    IF v_portfolio.cash_balance < v_total_amount THEN
      RAISE EXCEPTION 'Insufficient funds';
    END IF;

    v_entry_price := v_holding.average_cost;

    UPDATE portfolios
    SET cash_balance = cash_balance - v_total_amount,
        updated_at = now()
    WHERE user_id = v_trade.user_id;

    v_new_shares := v_holding.shares + v_trade.shares;

    IF v_new_shares = 0 THEN
      DELETE FROM holdings WHERE id = v_holding.id;
    ELSE
      UPDATE holdings
      SET shares = v_new_shares,
          updated_at = now()
      WHERE id = v_holding.id;
    END IF;

  ELSE
    RAISE EXCEPTION 'Invalid trade type: %', v_trade.trade_type;
  END IF;

  UPDATE trades
  SET status = 'completed',
      executed_price = p_executed_price,
      filled_at = now(),
      total_amount = v_total_amount,
      entry_price = v_entry_price
  WHERE id = v_trade.id;

  RETURN json_build_object(
    'success', true,
    'trade_id', v_trade.id,
    'total_amount', v_total_amount
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats JSON;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_owner(auth.uid())) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_trades', (SELECT COUNT(*) FROM public.trades),
    'total_trades_today', (SELECT COUNT(*) FROM public.trades WHERE created_at >= CURRENT_DATE),
    'total_buy_orders', (SELECT COUNT(*) FROM public.trades WHERE trade_type IN ('buy', 'cover')),
    'total_sell_orders', (SELECT COUNT(*) FROM public.trades WHERE trade_type IN ('sell', 'short')),
    'total_volume', (SELECT COALESCE(SUM(total_amount), 0) FROM public.trades),
    'active_holdings', (SELECT COUNT(*) FROM public.holdings WHERE shares <> 0),
    'unique_stocks_traded', (SELECT COUNT(DISTINCT symbol) FROM public.trades),
    'avg_portfolio_value', (SELECT COALESCE(AVG(cash_balance), 10000) FROM public.portfolios),
    'completed_lessons', (SELECT COUNT(*) FROM public.user_progress WHERE completed = true)
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$;
