import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_value: number;
  gain_percent: number;
  rank: number;
  profile_public: boolean;
  is_current_user: boolean;
}

export const useLeaderboard = () => {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      // Use the secure RPC function that only returns non-sensitive leaderboard data
      const { data, error } = await supabase.rpc('get_leaderboard');

      if (error) throw error;

      // Transform the data to match the expected interface
      const entries: LeaderboardEntry[] = (data || []).map((entry: {
        user_id: string;
        display_name: string;
        total_value: number;
        gain_percent: number;
        rank: number;
        profile_public: boolean;
        is_current_user: boolean;
      }) => ({
        user_id: entry.user_id,
        display_name: entry.display_name || 'Anonymous',
        total_value: Number(entry.total_value),
        gain_percent: Number(entry.gain_percent),
        rank: Number(entry.rank),
        profile_public: entry.profile_public,
        is_current_user: entry.is_current_user,
      }));

      return entries;
    },
  });
};
