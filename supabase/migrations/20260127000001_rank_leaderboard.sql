DROP FUNCTION IF EXISTS public.get_rank_leaderboard();

CREATE FUNCTION public.get_rank_leaderboard()
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  xp INTEGER,
  rank_index INTEGER,
  rank_name TEXT,
  rank INTEGER,
  profile_public BOOLEAN,
  is_current_user BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH xp_rows AS (
    SELECT
      gs.user_id,
      COALESCE(gs.xp, 0)::INTEGER AS xp
    FROM public.garden_state gs
  ),
  ranked AS (
    SELECT
      p.user_id,
      COALESCE(p.display_name, 'Anonymous')::TEXT AS display_name,
      COALESCE(xr.xp, 0)::INTEGER AS xp,
      GREATEST(0, FLOOR(COALESCE(xr.xp, 0) / 500))::INTEGER AS rank_index,
      p.profile_public,
      (p.user_id = auth.uid()) AS is_current_user
    FROM public.profiles p
    LEFT JOIN xp_rows xr ON xr.user_id = p.user_id
    WHERE p.display_name IS NOT NULL
  ),
  with_rank_name AS (
    SELECT
      r.user_id,
      r.display_name,
      r.xp,
      r.rank_index,
      CASE
        WHEN FLOOR(r.rank_index / 3) <= 0 THEN 'Bronze'
        WHEN FLOOR(r.rank_index / 3) = 1 THEN 'Silver'
        WHEN FLOOR(r.rank_index / 3) = 2 THEN 'Gold'
        WHEN FLOOR(r.rank_index / 3) = 3 THEN 'Platinum'
        WHEN FLOOR(r.rank_index / 3) = 4 THEN 'Diamond'
        WHEN FLOOR(r.rank_index / 3) = 5 THEN 'Master'
        WHEN FLOOR(r.rank_index / 3) = 6 THEN 'Grandmaster'
        ELSE 'Legend'
      END
      || ' ' ||
      CASE (r.rank_index % 3)
        WHEN 0 THEN 'I'
        WHEN 1 THEN 'II'
        ELSE 'III'
      END AS rank_name,
      r.profile_public,
      r.is_current_user,
      ROW_NUMBER() OVER (ORDER BY r.rank_index DESC, r.xp DESC)::INTEGER AS leaderboard_rank
    FROM ranked r
  )
  SELECT
    w.user_id,
    w.display_name,
    w.xp,
    w.rank_index,
    w.rank_name,
    w.leaderboard_rank AS rank,
    w.profile_public,
    w.is_current_user
  FROM with_rank_name w
  WHERE w.leaderboard_rank <= 10 OR w.is_current_user = true
  ORDER BY w.leaderboard_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_rank_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rank_leaderboard() TO anon;
