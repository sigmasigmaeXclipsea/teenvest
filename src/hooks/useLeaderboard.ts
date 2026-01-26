import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_value: number;
  gain_percent: number;
  rank: number;
  profile_public: boolean;
}

export const useLeaderboard = () => {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      // Use the secure RPC function that only returns non-sensitive leaderboard data
      const { data, error } = await supabase.rpc('get_leaderboard');
      if (error) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/744e271c-c7d9-439f-a2cd-18d8a6231997',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useLeaderboard.ts:19',message:'leaderboard rpc error',data:{errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        throw error;
      }

      const summary = Array.isArray(data) && data.length > 0
        ? {
            entryCount: data.length,
            topGainPercent: Number(data[0]?.gain_percent ?? 0),
            topTotalValue: Number(data[0]?.total_value ?? 0),
          }
        : { entryCount: 0 };
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/744e271c-c7d9-439f-a2cd-18d8a6231997',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useLeaderboard.ts:30',message:'leaderboard rpc result',data:summary,timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion

      // Transform the data to match the expected interface
      const entries: LeaderboardEntry[] = (data || []).map((entry: {
        user_id: string;
        display_name: string;
        total_value: number;
        gain_percent: number;
        rank: number;
        profile_public: boolean;
      }) => ({
        user_id: entry.user_id,
        display_name: entry.display_name || 'Anonymous',
        total_value: Number(entry.total_value),
        gain_percent: Number(entry.gain_percent),
        rank: Number(entry.rank),
        profile_public: Boolean(entry.profile_public),
      }));

      return entries;
    },
  });
};
