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
    queryFn: async (): Promise<RankLeaderboardEntry[]> => {
      // Return empty array since the RPC function no longer exists
      return [];
    },
  });
};
