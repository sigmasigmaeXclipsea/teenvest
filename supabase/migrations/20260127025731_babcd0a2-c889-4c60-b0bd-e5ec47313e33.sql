-- Fix profiles table exposure
-- Remove the overly permissive public profiles policy
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;

-- The existing "Users can view own profile" policy is sufficient for direct table access
-- Public profile access should ONLY go through the secure get_public_profile() RPC function
-- which already filters sensitive fields and respects the profile_public toggle