import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { fetchCandlestickData, type CandlestickData, type TimePeriod } from '@/hooks/useStockAPI';
import { usePendingOrders, useCancelOrder } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const getPeriodForTime = (timestamp: string): TimePeriod => {
  const ageMs = Date.now() - new Date(timestamp).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (ageMs <= dayMs) return '1d';
  if (ageMs <= 5 * dayMs) return '5d';
  if (ageMs <= 30 * dayMs) return '1m';
  if (ageMs <= 90 * dayMs) return '3m';
  if (ageMs <= 180 * dayMs) return '6m';
  if (ageMs <= 365 * dayMs) return '1y';
  return '2y';
};

const getCandlesSince = (candles: CandlestickData[], sinceEpoch: number) =>
  candles.filter((c) => c.time > sinceEpoch);

export const useOrderProcessor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: pendingOrders } = usePendingOrders();
  const queryClient = useQueryClient();
  const processingRef = useRef(false);

  const processPendingOrders = useCallback(async () => {
    if (!user || !pendingOrders || pendingOrders.length === 0) return;
    if (processingRef.current) return;

    processingRef.current = true;
    const candleCache = new Map<string, CandlestickData[]>();

    try {
      for (const order of pendingOrders) {
        try {
          const orderData = order as any;
          const limitPrice = orderData.limit_price ?? null;
          const stopPrice = orderData.stop_price ?? null;
          const targetPrice = limitPrice ?? stopPrice ?? orderData.price;
          if (!targetPrice || targetPrice <= 0) continue;

          const period = getPeriodForTime(orderData.created_at);
          const cacheKey = `${orderData.symbol}-${period}`;
          let candles = candleCache.get(cacheKey);
          if (!candles) {
            candles = await fetchCandlestickData(orderData.symbol, period);
            candleCache.set(cacheKey, candles);
          }

          const createdAtSeconds = Math.floor(new Date(orderData.created_at).getTime() / 1000);
          const relevantCandles = getCandlesSince(candles, createdAtSeconds);
          if (relevantCandles.length === 0) continue;

          const isBuy = orderData.trade_type === 'buy' || orderData.trade_type === 'cover';
          const isLimit = orderData.order_type === 'limit';

          const filled = relevantCandles.some((c) => {
            if (isLimit) {
              return isBuy ? c.low <= targetPrice : c.high >= targetPrice;
            }
            return isBuy ? c.high >= targetPrice : c.low <= targetPrice;
          });

          if (filled) {
            // Execute the trade using the RPC
            const { error } = await (supabase.rpc as any)('execute_trade', {
              p_user_id: user.id,
              p_symbol: orderData.symbol,
              p_company_name: orderData.company_name,
              p_trade_type: orderData.trade_type,
              p_order_type: 'market',
              p_shares: orderData.shares,
              p_price: targetPrice,
              p_sector: null,
            });

            if (!error) {
              // Update the order status to completed
              await (supabase
                .from('trades') as any)
                .update({ status: 'completed' })
                .eq('id', orderData.id);

              queryClient.invalidateQueries({ queryKey: ['portfolio'] });
              queryClient.invalidateQueries({ queryKey: ['holdings'] });
              queryClient.invalidateQueries({ queryKey: ['trades'] });
              queryClient.invalidateQueries({ queryKey: ['pending-orders'] });

              toast({
                title: 'Order filled',
                description: `${orderData.symbol} filled at $${targetPrice.toFixed(2)}.`,
              });
            }
          }
        } catch (error) {
          console.error('Failed to process order', (order as any).id, error);
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [user, pendingOrders, queryClient, toast]);

  useEffect(() => {
    processPendingOrders();
  }, [processPendingOrders]);

  useEffect(() => {
    const interval = setInterval(() => {
      processPendingOrders();
    }, 60_000);
    return () => clearInterval(interval);
  }, [processPendingOrders]);
};
