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
    }: {
      symbol: string;
      companyName: string;
      tradeType: 'buy' | 'sell';
      orderType: 'market' | 'limit' | 'stop';
      shares: number;
      price: number;
      sector?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const totalAmount = shares * price;

      // Get current portfolio
      const { data: portfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (portfolioError) throw portfolioError;

      if (tradeType === 'buy') {
        if (Number(portfolio.cash_balance) < totalAmount) {
          throw new Error('Insufficient funds');
        }

        // Update cash balance
        const { error: updateError } = await supabase
          .from('portfolios')
          .update({ cash_balance: Number(portfolio.cash_balance) - totalAmount })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Check if holding exists
        const { data: existingHolding } = await supabase
          .from('holdings')
          .select('*')
          .eq('user_id', user.id)
          .eq('symbol', symbol)
          .single();

        if (existingHolding) {
          // Update existing holding
          const newShares = Number(existingHolding.shares) + shares;
          const newAvgCost = ((Number(existingHolding.shares) * Number(existingHolding.average_cost)) + totalAmount) / newShares;
          
          const { error: holdingError } = await supabase
            .from('holdings')
            .update({ shares: newShares, average_cost: newAvgCost })
            .eq('id', existingHolding.id);

          if (holdingError) throw holdingError;
        } else {
          // Create new holding
          const { error: holdingError } = await supabase
            .from('holdings')
            .insert({
              user_id: user.id,
              symbol,
              company_name: companyName,
              shares,
              average_cost: price,
              sector,
            });

          if (holdingError) throw holdingError;
        }
      } else {
        // Sell
        const { data: existingHolding } = await supabase
          .from('holdings')
          .select('*')
          .eq('user_id', user.id)
          .eq('symbol', symbol)
          .single();

        if (!existingHolding || Number(existingHolding.shares) < shares) {
          throw new Error('Insufficient shares');
        }

        // Update cash balance
        const { error: updateError } = await supabase
          .from('portfolios')
          .update({ cash_balance: Number(portfolio.cash_balance) + totalAmount })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        const remainingShares = Number(existingHolding.shares) - shares;
        if (remainingShares === 0) {
          // Delete holding
          const { error: deleteError } = await supabase
            .from('holdings')
            .delete()
            .eq('id', existingHolding.id);

          if (deleteError) throw deleteError;
        } else {
          // Update holding
          const { error: holdingError } = await supabase
            .from('holdings')
            .update({ shares: remainingShares })
            .eq('id', existingHolding.id);

          if (holdingError) throw holdingError;
        }
      }

      // Record trade
      const { error: tradeError } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          symbol,
          company_name: companyName,
          trade_type: tradeType,
          order_type: orderType,
          shares,
          price,
          total_amount: totalAmount,
          status: 'completed',
        });

      if (tradeError) throw tradeError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
};
