-- Add prediction metadata, execution details, and pending order support

ALTER TABLE public.trades
  ADD COLUMN sector TEXT,
  ADD COLUMN prediction_direction TEXT,
  ADD COLUMN prediction_thesis TEXT,
  ADD COLUMN prediction_indicators JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN prediction_target NUMERIC,
  ADD COLUMN prediction_horizon_at TIMESTAMPTZ,
  ADD COLUMN prediction_outcomes JSONB,
  ADD COLUMN executed_price NUMERIC,
  ADD COLUMN filled_at TIMESTAMPTZ,
  ADD COLUMN near_miss BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN near_miss_details JSONB,
  ADD COLUMN entry_price NUMERIC;

UPDATE public.trades
SET executed_price = price,
    filled_at = created_at
WHERE executed_price IS NULL
  AND status = 'completed';

-- Update execute_trade to persist prediction metadata and execution details
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
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Calculate total amount
  v_total_amount := p_shares * p_price;

  -- Lock and fetch the portfolio row
  SELECT * INTO v_portfolio
  FROM portfolios
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portfolio not found for user';
  END IF;

  IF p_trade_type = 'buy' THEN
    -- Check sufficient funds
    IF v_portfolio.cash_balance < v_total_amount THEN
      RAISE EXCEPTION 'Insufficient funds';
    END IF;

    -- Update cash balance
    UPDATE portfolios
    SET cash_balance = cash_balance - v_total_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Lock and check existing holding
    SELECT * INTO v_holding
    FROM holdings
    WHERE user_id = p_user_id AND symbol = p_symbol
    FOR UPDATE;

    IF FOUND THEN
      -- Update existing holding with new average cost
      v_new_shares := v_holding.shares + p_shares;
      v_new_avg_cost := ((v_holding.shares * v_holding.average_cost) + v_total_amount) / v_new_shares;

      UPDATE holdings
      SET shares = v_new_shares,
          average_cost = v_new_avg_cost,
          updated_at = now()
      WHERE id = v_holding.id;
    ELSE
      -- Create new holding
      INSERT INTO holdings (user_id, symbol, company_name, shares, average_cost, sector)
      VALUES (p_user_id, p_symbol, p_company_name, p_shares, p_price, p_sector);
    END IF;

  ELSIF p_trade_type = 'sell' THEN
    -- Lock and check existing holding
    SELECT * INTO v_holding
    FROM holdings
    WHERE user_id = p_user_id AND symbol = p_symbol
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No holding found for this symbol';
    END IF;

    IF v_holding.shares < p_shares THEN
      RAISE EXCEPTION 'Insufficient shares';
    END IF;

    v_entry_price := v_holding.average_cost;

    -- Update cash balance
    UPDATE portfolios
    SET cash_balance = cash_balance + v_total_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    v_new_shares := v_holding.shares - p_shares;

    IF v_new_shares = 0 THEN
      -- Delete holding if no shares remain
      DELETE FROM holdings WHERE id = v_holding.id;
    ELSE
      -- Update holding
      UPDATE holdings
      SET shares = v_new_shares,
          updated_at = now()
      WHERE id = v_holding.id;
    END IF;

  ELSE
    RAISE EXCEPTION 'Invalid trade type: %', p_trade_type;
  END IF;

  -- Record the trade
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

  -- Return success with trade details
  RETURN json_build_object(
    'success', true,
    'trade_id', v_trade_id,
    'total_amount', v_total_amount
  );
END;
$$;

-- Create pending order placement function (limit/stop)
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

-- Fill a pending order with an executed price
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

    UPDATE portfolios
    SET cash_balance = cash_balance - v_total_amount,
        updated_at = now()
    WHERE user_id = v_trade.user_id;

    SELECT * INTO v_holding
    FROM holdings
    WHERE user_id = v_trade.user_id AND symbol = v_trade.symbol
    FOR UPDATE;

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

    IF NOT FOUND THEN
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

-- Mark a pending order as a near-miss (keeps it pending)
CREATE OR REPLACE FUNCTION public.mark_near_miss(
  p_trade_id UUID,
  p_details JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trade trades%ROWTYPE;
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

  UPDATE trades
  SET near_miss = true,
      near_miss_details = p_details
  WHERE id = v_trade.id;

  RETURN json_build_object('success', true, 'trade_id', v_trade.id);
END;
$$;

-- Cancel a pending order
CREATE OR REPLACE FUNCTION public.cancel_order(
  p_trade_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trade trades%ROWTYPE;
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

  UPDATE trades
  SET status = 'cancelled'
  WHERE id = v_trade.id;

  RETURN json_build_object('success', true, 'trade_id', v_trade.id);
END;
$$;

-- Update prediction outcomes for a trade
CREATE OR REPLACE FUNCTION public.update_trade_outcomes(
  p_trade_id UUID,
  p_user_id UUID,
  p_outcomes JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trade trades%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_trade
  FROM trades
  WHERE id = p_trade_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trade not found';
  END IF;

  IF v_trade.user_id <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE trades
  SET prediction_outcomes = COALESCE(prediction_outcomes, '{}'::jsonb) || p_outcomes
  WHERE id = v_trade.id;

  RETURN json_build_object('success', true, 'trade_id', v_trade.id);
END;
$$;
