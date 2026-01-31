import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  company_name: string;
  trade_type: 'buy' | 'sell' | 'short' | 'cover';
  order_type: 'market' | 'limit' | 'stop';
  shares: number;
  price: number;
  executed_price?: number | null;
  filled_at?: string | null;
  sector?: string | null;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  limit_price: number | null;
  stop_price: number | null;
  entry_price?: number | null;
  prediction_direction?: 'up' | 'down' | null;
  prediction_thesis?: string | null;
  prediction_indicators?: string[] | null;
  prediction_target?: number | null;
  prediction_horizon_at?: string | null;
  prediction_outcomes?: Record<string, any> | null;
  near_miss?: boolean;
  near_miss_details?: Record<string, any> | null;
  created_at: string;
}

export const useTrades = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trades', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data as Trade[]) || [];
    },
    enabled: !!user,
  });
};
