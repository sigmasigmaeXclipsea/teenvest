-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Only allow users to view their own profile directly
-- Public profile viewing must go through the secure get_public_profile() RPC function
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);