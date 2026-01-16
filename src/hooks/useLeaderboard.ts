import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  display_name: string;
  total_value: number;
  gain_percent: number;
  rank: number;
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
        display_name: string;
        total_value: number;
        gain_percent: number;
        rank: number;
      }) => ({
        display_name: entry.display_name || 'Anonymous',
        total_value: Number(entry.total_value),
        gain_percent: Number(entry.gain_percent),
        rank: Number(entry.rank),
      }));

      return entries;
    },
  });
};
