import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Note: These hooks call RPC functions that may not exist in the current database schema.
// If you see errors, the database needs to be migrated to add the required functions.

export interface PendingOrderInput {
  symbol: string;
  companyName: string;
  tradeType: 'buy' | 'sell' | 'short' | 'cover';
  orderType: 'limit' | 'stop';
  shares: number;
  price: number;
  sector?: string;
  limitPrice?: number | null;
  stopPrice?: number | null;
}

export const usePendingOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-orders', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });
};

export const usePlaceOrder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PendingOrderInput) => {
      if (!user) throw new Error('Not authenticated');

      // Insert as pending trade directly (no RPC function needed)
      const { data, error } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          symbol: input.symbol,
          company_name: input.companyName,
          trade_type: input.tradeType,
          order_type: input.orderType,
          shares: input.shares,
          price: input.price,
          total_amount: input.shares * input.price,
          limit_price: input.limitPrice ?? null,
          stop_price: input.stopPrice ?? null,
          status: 'pending',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
    },
  });
};

export const useCancelOrder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tradeId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase
        .from('trades') as any)
        .update({ status: 'cancelled' })
        .eq('id', tradeId)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
    },
  });
};
