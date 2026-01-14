import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  company_name: string;
  trade_type: 'buy' | 'sell';
  order_type: 'market' | 'limit' | 'stop';
  shares: number;
  price: number;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  limit_price: number | null;
  stop_price: number | null;
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
