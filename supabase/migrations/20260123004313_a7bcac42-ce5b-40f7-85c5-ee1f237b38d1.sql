-- Create user_settings table for preferences including advanced mode
CREATE TABLE public.user_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    advanced_mode BOOLEAN NOT NULL DEFAULT false,
    dark_mode BOOLEAN NOT NULL DEFAULT false,
    notifications_price_alerts BOOLEAN NOT NULL DEFAULT true,
    notifications_trade_confirmations BOOLEAN NOT NULL DEFAULT true,
    notifications_weekly_digest BOOLEAN NOT NULL DEFAULT false,
    notifications_achievements BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only view their own settings
CREATE POLICY "Users can view own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create daily_streaks table for tracking user login streaks
CREATE TABLE public.daily_streaks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    total_active_days INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;

-- Users can only view their own streaks
CREATE POLICY "Users can view own streaks"
ON public.daily_streaks
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own streaks
CREATE POLICY "Users can insert own streaks"
ON public.daily_streaks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own streaks
CREATE POLICY "Users can update own streaks"
ON public.daily_streaks
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to update streaks when user is active
CREATE OR REPLACE FUNCTION public.update_daily_streak(p_user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_streak RECORD;
    v_today DATE := CURRENT_DATE;
    v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
    v_new_streak INTEGER;
    v_is_new_day BOOLEAN := false;
BEGIN
    -- Get or create streak record
    SELECT * INTO v_streak FROM daily_streaks WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- Create new streak record
        INSERT INTO daily_streaks (user_id, current_streak, longest_streak, last_activity_date, total_active_days)
        VALUES (p_user_id, 1, 1, v_today, 1)
        RETURNING * INTO v_streak;
        
        RETURN json_build_object(
            'current_streak', 1,
            'longest_streak', 1,
            'is_new_day', true,
            'total_active_days', 1
        );
    END IF;
    
    -- Check if already logged in today
    IF v_streak.last_activity_date = v_today THEN
        RETURN json_build_object(
            'current_streak', v_streak.current_streak,
            'longest_streak', v_streak.longest_streak,
            'is_new_day', false,
            'total_active_days', v_streak.total_active_days
        );
    END IF;
    
    v_is_new_day := true;
    
    -- Check if streak continues (yesterday) or resets
    IF v_streak.last_activity_date = v_yesterday THEN
        v_new_streak := v_streak.current_streak + 1;
    ELSE
        v_new_streak := 1; -- Reset streak
    END IF;
    
    -- Update streak record
    UPDATE daily_streaks
    SET 
        current_streak = v_new_streak,
        longest_streak = GREATEST(v_streak.longest_streak, v_new_streak),
        last_activity_date = v_today,
        total_active_days = v_streak.total_active_days + 1,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    RETURN json_build_object(
        'current_streak', v_new_streak,
        'longest_streak', GREATEST(v_streak.longest_streak, v_new_streak),
        'is_new_day', v_is_new_day,
        'total_active_days', v_streak.total_active_days + 1
    );
END;
$$;

-- Add trigger to update updated_at for user_settings
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to update updated_at for daily_streaks
CREATE TRIGGER update_daily_streaks_updated_at
BEFORE UPDATE ON public.daily_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();