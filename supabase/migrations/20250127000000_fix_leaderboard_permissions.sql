-- Fix leaderboard permissions and ensure it works properly

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;

-- Also grant to anon if needed for public viewing
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO anon;

-- Ensure RLS policies allow leaderboard access
-- The function uses SECURITY DEFINER so it should work with proper permissions
