-- Create the get_public_profile function that safely returns public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_is_public BOOLEAN;
BEGIN
  -- Check if profile exists and is public
  -- Note: profile_public column may not exist, so we handle that case
  SELECT COALESCE(
    (SELECT profile_public FROM profiles WHERE user_id = _user_id),
    true -- Default to public if column doesn't exist or profile not found
  ) INTO v_is_public;
  
  -- Check if profile exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = _user_id) THEN
    RETURN json_build_object('error', 'Profile not found');
  END IF;
  
  IF NOT v_is_public THEN
    RETURN json_build_object('error', 'Profile is private');
  END IF;
  
  -- Return only safe public data (no email, no internal user_id exposure, no financial details)
  SELECT json_build_object(
    'display_name', p.display_name,
    'avatar_url', p.avatar_url,
    'member_since', p.created_at,
    'achievements', COALESCE((
      SELECT json_agg(json_build_object(
        'id', a.id,
        'name', a.name,
        'description', a.description,
        'icon', a.icon,
        'earned_at', ua.earned_at
      ))
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = _user_id
    ), '[]'::json),
    'stats', json_build_object(
      'total_trades', (SELECT COUNT(*) FROM trades WHERE user_id = _user_id),
      'total_holdings', (SELECT COUNT(*) FROM holdings WHERE user_id = _user_id),
      'lessons_completed', (SELECT COUNT(*) FROM user_progress WHERE user_id = _user_id AND completed = true)
    )
  ) INTO v_result
  FROM profiles p 
  WHERE p.user_id = _user_id;
  
  RETURN v_result;
END;
$$;

-- Add profile_public column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'profile_public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN profile_public BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Add DELETE policy for portfolios table so users can delete their own portfolio if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'portfolios' 
    AND policyname = 'Users can delete their own portfolio'
  ) THEN
    CREATE POLICY "Users can delete their own portfolio"
      ON public.portfolios
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;