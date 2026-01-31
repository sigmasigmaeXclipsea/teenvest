import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export const useRankLeaderboard = () => {
  return useQuery({
    queryKey: ['rank-leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_rank_leaderboard' as any);
      if (error) throw error;

      const rawData = data as any[] | null;
      const entries: RankLeaderboardEntry[] = (rawData || []).map((entry: any) => ({
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
    },
  });
};
