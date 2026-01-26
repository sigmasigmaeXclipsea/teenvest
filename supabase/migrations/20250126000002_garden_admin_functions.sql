-- Admin functions for garden management
-- These functions allow admins to update user garden money and XP

-- Function to update user garden money
CREATE OR REPLACE FUNCTION admin_update_garden_money(
    _user_id UUID,
    _new_money INTEGER
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _user_email TEXT;
    _has_admin_role BOOLEAN;
BEGIN
    -- Check if caller has admin role
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) INTO _has_admin_role;
    
    IF NOT _has_admin_role THEN
        RETURN QUERY SELECT FALSE, 'Admin access required'::TEXT;
        RETURN;
    END IF;
    
    -- Get user email for logging
    SELECT email INTO _user_email 
    FROM auth.users 
    WHERE id = _user_id;
    
    IF _user_email IS NULL THEN
        RETURN QUERY SELECT FALSE, 'User not found'::TEXT;
        RETURN;
    END IF;
    
    -- Insert garden update record
    INSERT INTO garden_updates (user_id, money_change, xp_change, admin_id)
    VALUES (_user_id, _new_money, 0, auth.uid());
    
    -- Return success
    RETURN QUERY SELECT TRUE, 
        format('Garden money updated for %s to %s coins', _user_email, _new_money)::TEXT;
    RETURN;
END;
$$;

-- Function to update user garden XP
CREATE OR REPLACE FUNCTION admin_update_garden_xp(
    _user_id UUID,
    _new_xp INTEGER
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _user_email TEXT;
    _has_admin_role BOOLEAN;
BEGIN
    -- Check if caller has admin role
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) INTO _has_admin_role;
    
    IF NOT _has_admin_role THEN
        RETURN QUERY SELECT FALSE, 'Admin access required'::TEXT;
        RETURN;
    END IF;
    
    -- Get user email for logging
    SELECT email INTO _user_email 
    FROM auth.users 
    WHERE id = _user_id;
    
    IF _user_email IS NULL THEN
        RETURN QUERY SELECT FALSE, 'User not found'::TEXT;
        RETURN;
    END IF;
    
    -- Insert garden update record
    INSERT INTO garden_updates (user_id, money_change, xp_change, admin_id)
    VALUES (_user_id, 0, _new_xp, auth.uid());
    
    -- Return success
    RETURN QUERY SELECT TRUE, 
        format('Garden XP updated for %s to %s XP', _user_email, _new_xp)::TEXT;
    RETURN;
END;
$$;

-- Function to update both garden money and XP at once
CREATE OR REPLACE FUNCTION admin_update_garden_state(
    _user_id UUID,
    _new_money INTEGER,
    _new_xp INTEGER
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _user_email TEXT;
    _has_admin_role BOOLEAN;
BEGIN
    -- Check if caller has admin role
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) INTO _has_admin_role;
    
    IF NOT _has_admin_role THEN
        RETURN QUERY SELECT FALSE, 'Admin access required'::TEXT;
        RETURN;
    END IF;
    
    -- Get user email for logging
    SELECT email INTO _user_email 
    FROM auth.users 
    WHERE id = _user_id;
    
    IF _user_email IS NULL THEN
        RETURN QUERY SELECT FALSE, 'User not found'::TEXT;
        RETURN;
    END IF;
    
    -- Insert garden update record
    INSERT INTO garden_updates (user_id, money_change, xp_change, admin_id)
    VALUES (_user_id, _new_money, _new_xp, auth.uid());
    
    -- Return success
    RETURN QUERY SELECT TRUE, 
        format('Garden state updated for %s: %s coins, %s XP', _user_email, _new_money, _new_xp)::TEXT;
    RETURN;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_update_garden_money TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_garden_xp TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_garden_state TO authenticated;
