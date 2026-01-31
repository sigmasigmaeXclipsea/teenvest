-- Fix security findings: Add missing RLS policies

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR public.is_owner(auth.uid()));

-- Allow owner to update roles
CREATE POLICY "Owner can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_owner(auth.uid()));

-- Allow users to delete their own streak data
CREATE POLICY "Users can delete their own streaks"
ON public.daily_streaks
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own garden state
CREATE POLICY "Users can delete their own garden state"
ON public.garden_state
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own settings
CREATE POLICY "Users can delete their own settings"
ON public.user_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own progress
CREATE POLICY "Users can delete their own progress"
ON public.user_progress
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own quiz results
CREATE POLICY "Users can delete their own quiz results"
ON public.quiz_results
FOR DELETE
USING (auth.uid() = user_id);

-- Add policy for viewing public profiles
CREATE POLICY "Anyone can view public profiles"
ON public.profiles
FOR SELECT
USING (profile_public = true OR auth.uid() = user_id);