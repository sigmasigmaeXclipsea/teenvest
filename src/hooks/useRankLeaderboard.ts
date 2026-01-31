import { useQuery } from '@tanstack/react-query';

export interface RankLeaderboardEntry {
  user_id: string;
  display_name: string;
  xp: number;
  rank_index: number;
  rank_name: string;
  rank: number;
  profile_public: boolean;
  is_current_user: boolean;
}

// Note: The get_rank_leaderboard RPC was removed.
// This hook returns an empty array to maintain compatibility.
// The rank leaderboard mode is kept for future reimplementation.
export const useRankLeaderboard = () => {
  return useQuery({
    queryKey: ['rank-leaderboard'],
<<<<<<< HEAD
    queryFn: async (): Promise<RankLeaderboardEntry[]> => {
      // Return empty array since the RPC function no longer exists
      return [];
=======
    queryFn: async () => {
      // Use 'as any' because get_rank_leaderboard is not in the generated types yet
      const { data, error } = await (supabase.rpc as any)('get_rank_leaderboard');
      if (error) throw error;

      const rawData = Array.isArray(data) ? data : [];
      const entries: RankLeaderboardEntry[] = rawData.map((entry: any) => ({
        user_id: entry.user_id,
        display_name: entry.display_name || 'Anonymous',
        xp: Number(entry.xp) || 0,
        rank_index: Number(entry.rank_index) || 0,
        rank_name: entry.rank_name || 'Bronze I',
        rank: Number(entry.rank) || 0,
        profile_public: Boolean(entry.profile_public),
        is_current_user: Boolean(entry.is_current_user),
      }));

      return entries;
>>>>>>> a398009a4477ed85581aae27611f08e45fdfc99c
    },
  });
};
