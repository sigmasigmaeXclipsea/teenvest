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
      try {
        // Try the secure RPC function first
        const { data, error } = await supabase.rpc('get_leaderboard');
        if (error) {
          console.warn('Leaderboard RPC failed, trying fallback:', error);
          throw error; // Go to fallback
        }

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
          profile_public: Boolean(entry.profile_public),
          is_current_user: Boolean(entry.is_current_user),
        }));

        return entries;
      } catch (error) {
        console.log('Using fallback leaderboard system');
        
        // Fallback: Simple query without complex calculations
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            user_id,
            display_name,
            profile_public,
            portfolios!inner(
              cash_balance
            )
          `)
          .not('display_name', 'is', null)
          .order('cash_balance', { foreignTable: 'portfolios', ascending: false })
          .limit(10);

        if (profilesError) {
          console.error('Fallback leaderboard also failed:', profilesError);
          throw profilesError;
        }

        // Transform fallback data
        const fallbackEntries: LeaderboardEntry[] = (profiles || []).map((profile: any, index: number) => {
          const portfolioRow = Array.isArray(profile.portfolios) ? profile.portfolios[0] : profile.portfolios;
          const cashBalance = Number(portfolioRow?.cash_balance || 0);
          return {
            user_id: profile.user_id,
            display_name: profile.display_name || 'Anonymous',
            total_value: cashBalance,
          gain_percent: 0, // Simplified fallback
          rank: index + 1,
          profile_public: Boolean(profile.profile_public),
          is_current_user: false, // Will be updated by client
          };
        });

        return fallbackEntries;
      }
    },
    retry: 1, // Only retry once before using fallback
    retryDelay: 1000,
  });
};
