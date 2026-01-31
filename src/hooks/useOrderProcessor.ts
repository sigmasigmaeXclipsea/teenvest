import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { fetchCandlestickData, type CandlestickData, type TimePeriod } from '@/hooks/useStockAPI';
import { useTrades } from '@/hooks/useTrades';
import {
  usePendingOrders,
  useFillOrder,
  useMarkNearMiss,
  useUpdateTradeOutcomes,
} from '@/hooks/useOrders';

const NEAR_MISS_PCT = 0.0005;
const NEAR_MISS_MOVE_PCT = 0.01;

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

const getFirstCandleAfter = (candles: CandlestickData[], epochSeconds: number) =>
  candles.find((c) => c.time > epochSeconds) || null;

export const useOrderProcessor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: trades } = useTrades();
  const { data: pendingOrders } = usePendingOrders();
  const fillOrder = useFillOrder();
  const markNearMiss = useMarkNearMiss();
  const updateOutcomes = useUpdateTradeOutcomes();
  const processingRef = useRef(false);

  const completedTrades = useMemo(
    () => (trades || []).filter((trade) => trade.status === 'completed'),
    [trades]
  );

  const processPendingOrders = useCallback(async () => {
    if (!user || !pendingOrders || pendingOrders.length === 0) return;
    if (processingRef.current) return;

    processingRef.current = true;
    const candleCache = new Map<string, CandlestickData[]>();

    try {
      for (const order of pendingOrders) {
        try {
          const limitPrice = order.limit_price ?? null;
          const stopPrice = order.stop_price ?? null;
          const targetPrice = limitPrice ?? stopPrice ?? order.price;
          if (!targetPrice || targetPrice <= 0) continue;

          const period = getPeriodForTime(order.created_at);
          const cacheKey = `${order.symbol}-${period}`;
          let candles = candleCache.get(cacheKey);
          if (!candles) {
            candles = await fetchCandlestickData(order.symbol, period);
            candleCache.set(cacheKey, candles);
          }

          const createdAtSeconds = Math.floor(new Date(order.created_at).getTime() / 1000);
          const relevantCandles = getCandlesSince(candles, createdAtSeconds);
          if (relevantCandles.length === 0) continue;

          const isBuy = order.trade_type === 'buy' || order.trade_type === 'cover';
          const isLimit = order.order_type === 'limit';

          const filled = relevantCandles.some((c) => {
            if (isLimit) {
              return isBuy ? c.low <= targetPrice : c.high >= targetPrice;
            }
            return isBuy ? c.high >= targetPrice : c.low <= targetPrice;
          });

          if (filled) {
            await fillOrder.mutateAsync({ tradeId: order.id, executedPrice: targetPrice });
            toast({
              title: 'Order filled',
              description: `${order.symbol} filled at $${targetPrice.toFixed(2)}.`,
            });
            continue;
          }

          if (order.near_miss) continue;

          const candlesWithDistance = relevantCandles.map((c) => {
            const closest = isBuy
              ? isLimit
                ? (c.low - targetPrice) / targetPrice
                : (targetPrice - c.high) / targetPrice
              : isLimit
                ? (targetPrice - c.high) / targetPrice
                : (c.low - targetPrice) / targetPrice;
            return { candle: c, distance: Math.abs(closest) };
          });

          const closest = candlesWithDistance.reduce((best, next) =>
            next.distance < best.distance ? next : best
          );

          if (closest.distance > NEAR_MISS_PCT) continue;

          const closestIndex = relevantCandles.findIndex((c) => c.time === closest.candle.time);
          const afterCandles = relevantCandles.slice(closestIndex + 1);
          if (afterCandles.length === 0) continue;

          const movedAway = afterCandles.some((c) => {
            if (isLimit) {
              return isBuy
                ? c.close >= targetPrice * (1 + NEAR_MISS_MOVE_PCT)
                : c.close <= targetPrice * (1 - NEAR_MISS_MOVE_PCT);
            }
            return isBuy
              ? c.close <= targetPrice * (1 - NEAR_MISS_MOVE_PCT)
              : c.close >= targetPrice * (1 + NEAR_MISS_MOVE_PCT);
          });

          if (!movedAway) continue;

          const missBy = isLimit
            ? isBuy
              ? Math.max(0, closest.candle.low - targetPrice)
              : Math.max(0, targetPrice - closest.candle.high)
            : isBuy
              ? Math.max(0, targetPrice - closest.candle.high)
              : Math.max(0, closest.candle.low - targetPrice);
          const missByPct = missBy / targetPrice;

          await markNearMiss.mutateAsync({
            tradeId: order.id,
            details: {
              type: order.order_type,
              direction: order.trade_type,
              closestPrice: isLimit
                ? isBuy
                  ? closest.candle.low
                  : closest.candle.high
                : isBuy
                  ? closest.candle.high
                  : closest.candle.low,
              missBy,
              missByPct,
              threshold: NEAR_MISS_PCT,
              moveAwayPct: NEAR_MISS_MOVE_PCT,
              candleTime: closest.candle.time,
            },
          });

          toast({
            title: 'Near miss!',
            description: `You missed ${order.symbol} by ${(missByPct * 100).toFixed(2)}%. Your thesis was close.`,
          });
        } catch (error) {
          console.error('Failed to process order', order.id, error);
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [user, pendingOrders, fillOrder, markNearMiss, toast]);

  const processPredictionOutcomes = useCallback(async () => {
    if (!user || !completedTrades || completedTrades.length === 0) return;
    if (processingRef.current) return;

    processingRef.current = true;
    const candleCache = new Map<string, CandlestickData[]>();

    try {
      for (const trade of completedTrades) {
        try {
          const executedPrice = trade.executed_price ?? trade.price;
          if (!trade.prediction_direction || !executedPrice) continue;

          const outcomes = trade.prediction_outcomes || {};
          const tradeTime = trade.filled_at || trade.created_at;
          const period = getPeriodForTime(tradeTime);
          const cacheKey = `${trade.symbol}-${period}`;
          let candles = candleCache.get(cacheKey);
          if (!candles) {
            candles = await fetchCandlestickData(trade.symbol, period);
            candleCache.set(cacheKey, candles);
          }

          const tradeEpoch = Math.floor(new Date(tradeTime).getTime() / 1000);

          if (!outcomes.immediate) {
            const firstCandle = getFirstCandleAfter(candles, tradeEpoch);
            if (firstCandle) {
              const changePct = (firstCandle.close - executedPrice) / executedPrice;
              const directionCorrect =
                trade.prediction_direction === 'up' ? changePct >= 0 : changePct <= 0;
              const immediate = {
                candleTime: firstCandle.time,
                price: firstCandle.close,
                changePct,
                directionCorrect,
                notifiedAt: new Date().toISOString(),
              };

              await updateOutcomes.mutateAsync({
                tradeId: trade.id,
                outcomes: { immediate },
              });

              toast({
                title: 'Immediate outcome',
                description: `${trade.symbol} moved ${(changePct * 100).toFixed(2)}% after your trade.`,
                variant: directionCorrect ? 'default' : 'destructive',
              });
            }
          }

          if (trade.prediction_horizon_at && !outcomes.horizon) {
            const horizonEpoch = Math.floor(new Date(trade.prediction_horizon_at).getTime() / 1000);
            if (horizonEpoch <= Math.floor(Date.now() / 1000)) {
              const horizonCandle = getFirstCandleAfter(candles, horizonEpoch - 1);
              if (horizonCandle) {
              const changePct = (horizonCandle.close - executedPrice) / executedPrice;
                const directionCorrect =
                  trade.prediction_direction === 'up' ? changePct >= 0 : changePct <= 0;
                const horizon = {
                  candleTime: horizonCandle.time,
                  price: horizonCandle.close,
                  changePct,
                  directionCorrect,
                  notifiedAt: new Date().toISOString(),
                };

                await updateOutcomes.mutateAsync({
                  tradeId: trade.id,
                  outcomes: { horizon },
                });

                toast({
                  title: 'Horizon check',
                  description: `${trade.symbol} is ${(changePct * 100).toFixed(2)}% vs your prediction.`,
                  variant: directionCorrect ? 'default' : 'destructive',
                });
              }
            }
          }

          if ((trade.trade_type === 'sell' || trade.trade_type === 'cover') && trade.entry_price && !outcomes.close) {
            const priceChangePct = (executedPrice - trade.entry_price) / trade.entry_price;
            const returnPct = trade.trade_type === 'cover' ? -priceChangePct : priceChangePct;
            const directionCorrect =
              trade.prediction_direction === 'up' ? priceChangePct >= 0 : priceChangePct <= 0;
            const close = {
              price: executedPrice,
              changePct: returnPct,
              directionCorrect,
              notifiedAt: new Date().toISOString(),
            };

            await updateOutcomes.mutateAsync({
              tradeId: trade.id,
              outcomes: { close },
            });

            toast({
              title: 'Trade closed',
              description: `Return vs entry: ${(returnPct * 100).toFixed(2)}%.`,
              variant: directionCorrect ? 'default' : 'destructive',
            });
          }
        } catch (error) {
          console.error('Failed to process outcomes', trade.id, error);
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [user, completedTrades, updateOutcomes, toast]);

  useEffect(() => {
    processPendingOrders();
  }, [processPendingOrders]);

  useEffect(() => {
    processPredictionOutcomes();
  }, [processPredictionOutcomes]);

  useEffect(() => {
    const interval = setInterval(() => {
      processPendingOrders();
      processPredictionOutcomes();
    }, 60_000);
    return () => clearInterval(interval);
  }, [processPendingOrders, processPredictionOutcomes]);
};
