-- Get platform statistics (admins only)
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
  -- Check if caller is admin or owner
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_owner(auth.uid())) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_trades', (SELECT COUNT(*) FROM public.trades),
    'total_trades_today', (SELECT COUNT(*) FROM public.trades WHERE created_at >= CURRENT_DATE),
    'total_buy_orders', (SELECT COUNT(*) FROM public.trades WHERE trade_type = 'buy'),
    'total_sell_orders', (SELECT COUNT(*) FROM public.trades WHERE trade_type = 'sell'),
    'total_volume', (SELECT COALESCE(SUM(total_amount), 0) FROM public.trades),
    'active_holdings', (SELECT COUNT(*) FROM public.holdings WHERE shares > 0),
    'unique_stocks_traded', (SELECT COUNT(DISTINCT symbol) FROM public.trades),
    'avg_portfolio_value', (SELECT COALESCE(AVG(cash_balance), 10000) FROM public.portfolios),
    'completed_lessons', (SELECT COUNT(*) FROM public.user_progress WHERE completed = true)
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$;

-- Get recent trades across platform (admins only)
CREATE OR REPLACE FUNCTION public.get_recent_platform_trades(_limit INT DEFAULT 20)
RETURNS TABLE(
  id UUID,
  user_email TEXT,
  symbol TEXT,
  trade_type TEXT,
  shares NUMERIC,
  price NUMERIC,
  total_amount NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin or owner
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_owner(auth.uid())) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    t.id,
    u.email,
    t.symbol,
    t.trade_type,
    t.shares,
    t.price,
    t.total_amount,
    t.created_at
  FROM public.trades t
  JOIN auth.users u ON t.user_id = u.id
  ORDER BY t.created_at DESC
  LIMIT _limit;
END;
$$;

-- Reset user portfolio to starting balance (admins only, for testing)
CREATE OR REPLACE FUNCTION public.admin_reset_portfolio(_target_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user_id UUID;
  v_starting_balance NUMERIC;
BEGIN
  -- Check if caller is admin or owner
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_owner(auth.uid())) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Get target user
  SELECT id INTO v_target_user_id FROM auth.users WHERE email = _target_email;
  
  IF v_target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Get starting balance from profile
  SELECT starting_balance INTO v_starting_balance 
  FROM public.profiles WHERE user_id = v_target_user_id;
  
  v_starting_balance := COALESCE(v_starting_balance, 10000);
  
  -- Delete all holdings
  DELETE FROM public.holdings WHERE user_id = v_target_user_id;
  
  -- Delete all trades
  DELETE FROM public.trades WHERE user_id = v_target_user_id;
  
  -- Reset cash balance
  UPDATE public.portfolios 
  SET cash_balance = v_starting_balance, updated_at = now()
  WHERE user_id = v_target_user_id;
  
  RETURN json_build_object(
    'success', true, 
    'reset_balance', v_starting_balance
  );
END;
$$;

-- Lookup user info by email (admins only)
CREATE OR REPLACE FUNCTION public.admin_lookup_user(_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_user_id UUID;
BEGIN
  -- Check if caller is admin or owner
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_owner(auth.uid())) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Get user id
  SELECT id INTO v_user_id FROM auth.users WHERE email = _email;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('found', false);
  END IF;
  
  SELECT json_build_object(
    'found', true,
    'email', _email,
    'display_name', p.display_name,
    'cash_balance', port.cash_balance,
    'starting_balance', p.starting_balance,
    'holdings_count', (SELECT COUNT(*) FROM public.holdings WHERE user_id = v_user_id),
    'trades_count', (SELECT COUNT(*) FROM public.trades WHERE user_id = v_user_id),
    'total_invested', (SELECT COALESCE(SUM(h.shares * h.average_cost), 0) FROM public.holdings h WHERE h.user_id = v_user_id),
    'lessons_completed', (SELECT COUNT(*) FROM public.user_progress WHERE user_id = v_user_id AND completed = true),
    'achievements_earned', (SELECT COUNT(*) FROM public.user_achievements WHERE user_id = v_user_id),
    'created_at', p.created_at
  ) INTO v_result
  FROM public.profiles p
  LEFT JOIN public.portfolios port ON p.user_id = port.user_id
  WHERE p.user_id = v_user_id;
  
  RETURN COALESCE(v_result, json_build_object('found', false));
END;
$$;

-- Update user's starting balance (admins only)
CREATE OR REPLACE FUNCTION public.admin_set_starting_balance(_email TEXT, _new_balance NUMERIC)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if caller is admin or owner
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_owner(auth.uid())) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Get user id
  SELECT id INTO v_user_id FROM auth.users WHERE email = _email;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Update starting balance
  UPDATE public.profiles 
  SET starting_balance = _new_balance, updated_at = now()
  WHERE user_id = v_user_id;
  
  RETURN json_build_object('success', true, 'new_balance', _new_balance);
END;
$$;

-- Grant achievement to user (admins only)
CREATE OR REPLACE FUNCTION public.admin_grant_achievement(_email TEXT, _achievement_name TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_achievement_id UUID;
BEGIN
  -- Check if caller is admin or owner
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_owner(auth.uid())) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Get user id
  SELECT id INTO v_user_id FROM auth.users WHERE email = _email;
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Get achievement id
  SELECT id INTO v_achievement_id FROM public.achievements WHERE name = _achievement_name;
  IF v_achievement_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Achievement not found');
  END IF;
  
  -- Grant achievement
  INSERT INTO public.user_achievements (user_id, achievement_id)
  VALUES (v_user_id, v_achievement_id)
  ON CONFLICT (user_id, achievement_id) DO NOTHING;
  
  RETURN json_build_object('success', true, 'achievement', _achievement_name);
END;
$$;

-- Get all achievements for dropdown
CREATE OR REPLACE FUNCTION public.get_all_achievements()
RETURNS TABLE(id UUID, name TEXT, description TEXT, icon TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, description, icon FROM public.achievements ORDER BY name;
$$;