import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Portfolio {
  id: string;
  user_id: string;
  cash_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Holding {
  id: string;
  user_id: string;
  symbol: string;
  company_name: string;
  shares: number;
  average_cost: number;
  sector: string | null;
  created_at: string;
  updated_at: string;
}

export const usePortfolio = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data as Portfolio;
    },
    enabled: !!user,
  });
};

export const useHoldings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['holdings', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return (data as Holding[]) || [];
    },
    enabled: !!user,
  });
};

export const useExecuteTrade = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      symbol,
      companyName,
      tradeType,
      orderType,
      shares,
      price,
      sector,
      allowMargin,
      marginMultiplier,
    }: {
      symbol: string;
      companyName: string;
      tradeType: 'buy' | 'sell' | 'short' | 'cover';
      orderType: 'market' | 'limit' | 'stop';
      shares: number;
      price: number;
      sector?: string;
      allowMargin?: boolean;
      marginMultiplier?: number;
      // Prediction fields are optional and not stored in current schema
      predictionDirection?: 'up' | 'down';
      predictionThesis?: string;
      predictionIndicators?: string[];
      predictionTarget?: number | null;
      predictionHorizonAt?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Use atomic stored procedure for trade execution
      // This prevents race conditions by using row-level locking and transactions
      const { data, error } = await (supabase.rpc as any)('execute_trade', {
        p_user_id: user.id,
        p_symbol: symbol,
        p_company_name: companyName,
        p_trade_type: tradeType,
        p_order_type: orderType,
        p_shares: shares,
        p_price: price,
        p_sector: sector || null,
        p_allow_margin: Boolean(allowMargin),
        p_margin_multiplier: Number.isFinite(marginMultiplier as number) ? marginMultiplier : 1,
      });

      if (error) {
        const message = error.message || '';
        // Map database errors to user-friendly messages
        if (message.includes('Insufficient funds')) {
          throw new Error('Insufficient funds');
        }
        if (message.includes('Insufficient shares')) {
          throw new Error('Insufficient shares');
        }
        if (message.includes('No holding found')) {
          throw new Error('Insufficient shares');
        }
        if (message.includes('Portfolio not found')) {
          throw new Error('Portfolio not found');
        }
        throw error;
      }

      return data as { success: boolean; trade_id: string; total_amount: number } | null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
};
