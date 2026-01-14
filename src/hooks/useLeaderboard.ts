import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_value: number;
  gain_percent: number;
  starting_balance: number;
}

export const useLeaderboard = () => {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      // Get all profiles with their portfolios
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, starting_balance');

      if (profilesError) throw profilesError;

      const { data: portfolios, error: portfoliosError } = await supabase
        .from('portfolios')
        .select('user_id, cash_balance');

      if (portfoliosError) throw portfoliosError;

      // Create a map for quick lookup
      const portfolioMap = new Map(portfolios?.map(p => [p.user_id, Number(p.cash_balance)]) || []);

      // Calculate leaderboard entries
      const entries: LeaderboardEntry[] = (profiles || []).map(profile => {
        const cashBalance = portfolioMap.get(profile.user_id) || 10000;
        const startingBalance = Number(profile.starting_balance) || 10000;
        
        // For now, total value = cash balance (we'd need current stock prices to calculate holdings value)
        const totalValue = cashBalance;
        const gainPercent = ((totalValue - startingBalance) / startingBalance) * 100;

        return {
          user_id: profile.user_id,
          display_name: profile.display_name || 'Anonymous',
          total_value: totalValue,
          gain_percent: gainPercent,
          starting_balance: startingBalance,
        };
      });

      // Sort by gain percent
      return entries.sort((a, b) => b.gain_percent - a.gain_percent).slice(0, 10);
    },
  });
};
