CREATE OR REPLACE FUNCTION public.admin_update_cash_balance(
    _email TEXT, 
    _new_balance NUMERIC
)
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
  
  -- Get user id from email
  SELECT id INTO v_user_id FROM auth.users WHERE email = _email;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Update cash balance
  UPDATE public.portfolios 
  SET cash_balance = _new_balance, updated_at = now()
  WHERE user_id = v_user_id;
  
  -- Handle case where portfolio doesn't exist
  IF NOT FOUND THEN
    INSERT INTO public.portfolios (user_id, cash_balance)
    VALUES (v_user_id, _new_balance)
    ON CONFLICT (user_id) DO UPDATE
    SET cash_balance = _new_balance, updated_at = now();
  END IF;
  
  RETURN json_build_object('success', true, 'new_balance', _new_balance);
END;
$$;