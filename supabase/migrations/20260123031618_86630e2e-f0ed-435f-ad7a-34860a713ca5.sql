-- Drop the existing restrictive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a new policy that allows users to view their own profile OR view public profiles
CREATE POLICY "Users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id 
  OR profile_public = true
);