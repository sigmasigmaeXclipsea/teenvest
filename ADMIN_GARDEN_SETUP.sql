-- Run this SQL in your Supabase dashboard to create the garden admin functions
-- Go to: https://supabase.com/dashboard/project/your-project/sql

-- Create garden_updates table for tracking admin changes to gardens
CREATE TABLE IF NOT EXISTS garden_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    money_change INTEGER NOT NULL DEFAULT 0,
    xp_change INTEGER NOT NULL DEFAULT 0,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create garden_state table if it doesn't exist for storing user garden data
CREATE TABLE IF NOT EXISTS garden_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    money INTEGER NOT NULL DEFAULT 50,
    xp INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create or replace function to update user garden money
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
    
    -- Update or insert garden state
    INSERT INTO garden_state (user_id, money, updated_at)
    VALUES (_user_id, _new_money, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        money = _new_money,
        updated_at = NOW();
    
    -- Insert garden update record
    INSERT INTO garden_updates (user_id, money_change, admin_id)
    VALUES (_user_id, _new_money, auth.uid());
    
    -- Return success
    RETURN QUERY SELECT TRUE, 
        format('Garden money updated for %s to %s coins', _user_email, _new_money)::TEXT;
    RETURN;
END;
$$;

-- Create or replace function to update user garden XP
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
    
    -- Update or insert garden state
    INSERT INTO garden_state (user_id, xp, updated_at)
    VALUES (_user_id, _new_xp, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        xp = _new_xp,
        updated_at = NOW();
    
    -- Insert garden update record
    INSERT INTO garden_updates (user_id, xp_change, admin_id)
    VALUES (_user_id, _new_xp, auth.uid());
    
    -- Return success
    RETURN QUERY SELECT TRUE, 
        format('Garden XP updated for %s to %s XP', _user_email, _new_xp)::TEXT;
    RETURN;
END;
$$;

-- Create or replace function to update both garden money and XP at once
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
    
    -- Update or insert garden state
    INSERT INTO garden_state (user_id, money, xp, updated_at)
    VALUES (_user_id, _new_money, _new_xp, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        money = _new_money,
        xp = _new_xp,
        updated_at = NOW();
    
    -- Insert garden update record
    INSERT INTO garden_updates (user_id, money_change, xp_change, admin_id)
    VALUES (_user_id, _new_money, _new_xp, auth.uid());
    
    -- Return success
    RETURN QUERY SELECT TRUE, 
        format('Garden state updated for %s: %s coins, %s XP', _user_email, _new_money, _new_xp)::TEXT;
    RETURN;
END;
$$;

-- Create or replace function to get current garden state for admin
CREATE OR REPLACE FUNCTION admin_get_garden_state(
    _user_id UUID
)
RETURNS TABLE (
    money INTEGER,
    xp INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _has_admin_role BOOLEAN;
BEGIN
    -- Check if caller has admin role
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) INTO _has_admin_role;
    
    IF NOT _has_admin_role THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;
    
    -- Return garden state
    RETURN QUERY 
    SELECT money, xp, updated_at
    FROM garden_state 
    WHERE user_id = _user_id;
    
    -- If no record exists, return defaults
    IF NOT FOUND THEN
        RETURN QUERY SELECT 50, 0, NULL::TIMESTAMP WITH TIME ZONE;
    END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_update_garden_money TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_garden_xp TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_garden_state TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_garden_state TO authenticated;

-- Grant select permissions on garden_updates to authenticated users
GRANT SELECT ON garden_updates TO authenticated;
