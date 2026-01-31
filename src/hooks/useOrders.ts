import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  predictionDirection: 'up' | 'down';
  predictionThesis: string;
  predictionIndicators: string[];
  predictionTarget?: number | null;
  predictionHorizonAt?: string | null;
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

      const { data, error } = await supabase.rpc('place_order', {
        p_user_id: user.id,
        p_symbol: input.symbol,
        p_company_name: input.companyName,
        p_trade_type: input.tradeType,
        p_order_type: input.orderType,
        p_shares: input.shares,
        p_price: input.price,
        p_sector: input.sector || null,
        p_limit_price: input.limitPrice ?? null,
        p_stop_price: input.stopPrice ?? null,
        p_prediction_direction: input.predictionDirection,
        p_prediction_thesis: input.predictionThesis,
        p_prediction_indicators: input.predictionIndicators,
        p_prediction_target: input.predictionTarget ?? null,
        p_prediction_horizon_at: input.predictionHorizonAt ?? null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
    },
  });
};

export const useFillOrder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tradeId, executedPrice }: { tradeId: string; executedPrice: number }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('fill_order', {
        p_trade_id: tradeId,
        p_executed_price: executedPrice,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
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

      const { data, error } = await supabase.rpc('cancel_order', {
        p_trade_id: tradeId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
    },
  });
};

export const useMarkNearMiss = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tradeId, details }: { tradeId: string; details: Record<string, any> }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('mark_near_miss', {
        p_trade_id: tradeId,
        p_details: details,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
    },
  });
};

export const useUpdateTradeOutcomes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tradeId, outcomes }: { tradeId: string; outcomes: Record<string, any> }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('update_trade_outcomes', {
        p_trade_id: tradeId,
        p_user_id: user.id,
        p_outcomes: outcomes,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
};
