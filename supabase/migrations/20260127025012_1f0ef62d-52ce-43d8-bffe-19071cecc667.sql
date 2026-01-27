-- Fix 1: Add input validation to execute_trade function
CREATE OR REPLACE FUNCTION public.execute_trade(p_user_id uuid, p_symbol text, p_company_name text, p_trade_type text, p_order_type text, p_shares numeric, p_price numeric, p_sector text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_portfolio portfolios%ROWTYPE;
  v_holding holdings%ROWTYPE;
  v_total_amount NUMERIC;
  v_new_shares NUMERIC;
  v_new_avg_cost NUMERIC;
  v_trade_id UUID;
BEGIN
  -- Input validation
  IF p_shares IS NULL OR p_shares <= 0 OR p_shares > 1000000 THEN
    RAISE EXCEPTION 'Invalid shares: must be between 0.01 and 1,000,000';
  END IF;

  IF p_price IS NULL OR p_price <= 0 OR p_price > 1000000 THEN
    RAISE EXCEPTION 'Invalid price: must be between 0.01 and 1,000,000';
  END IF;

  IF p_symbol IS NULL OR p_symbol !~ '^[A-Z]{1,5}$' THEN
    RAISE EXCEPTION 'Invalid symbol format: must be 1-5 uppercase letters';
  END IF;

  IF p_trade_type NOT IN ('buy', 'sell') THEN
    RAISE EXCEPTION 'Invalid trade type: must be buy or sell';
  END IF;

  IF p_order_type NOT IN ('market', 'limit', 'stop') THEN
    RAISE EXCEPTION 'Invalid order type: must be market, limit, or stop';
  END IF;

  IF p_company_name IS NULL OR length(trim(p_company_name)) = 0 OR length(p_company_name) > 200 THEN
    RAISE EXCEPTION 'Invalid company name: must be between 1 and 200 characters';
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
    user_id, symbol, company_name, trade_type, order_type,
    shares, price, total_amount, status
  )
  VALUES (
    p_user_id, p_symbol, p_company_name, p_trade_type, p_order_type,
    p_shares, p_price, v_total_amount, 'completed'
  )
  RETURNING id INTO v_trade_id;

  -- Return success with trade details
  RETURN json_build_object(
    'success', true,
    'trade_id', v_trade_id,
    'total_amount', v_total_amount
  );
END;
$function$;

-- Fix 2: Add RLS policy for public profiles (profile_public = true)
CREATE POLICY "Anyone can view public profiles" 
ON public.profiles 
FOR SELECT 
USING (profile_public = true OR auth.uid() = user_id);