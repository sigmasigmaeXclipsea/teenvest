import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useTrades, type Trade } from '@/hooks/useTrades';
import { usePortfolio, useHoldings } from '@/hooks/usePortfolio';
import { loadTradePlans, type TradePlan } from '@/lib/disciplinePlans';

const REVENGE_WINDOW_MS = 60_000;
const PLAN_TOLERANCE_PCT = 0.005;
const LEVERAGE_THRESHOLD = 0.5;

export type DisciplineBreakdown = {
  plannedExits: number;
  adheredExits: number;
  planAdherenceRate: number;
  revengeTrades: number;
  overLeverageTrades: number;
  planMissPenalty: number;
  revengePenalty: number;
  leveragePenalty: number;
  startingBalance: number;
  accountValue: number;
  tradeSample: number;
};

const getTradeTimestamp = (trade: Trade) =>
  new Date(trade.filled_at || trade.created_at).getTime();

const getExecutedPrice = (trade: Trade) =>
  Number(trade.executed_price ?? trade.price ?? 0);

const isLossTrade = (trade: Trade) => {
  if (trade.trade_type !== 'sell' && trade.trade_type !== 'cover') return false;
  if (trade.entry_price == null) return false;
  const executed = getExecutedPrice(trade);
  if (!Number.isFinite(executed) || executed <= 0) return false;
  const entry = Number(trade.entry_price);
  return trade.trade_type === 'cover' ? executed > entry : executed < entry;
};

const didExitAtPlan = (trade: Trade, plan: TradePlan) => {
  const executed = getExecutedPrice(trade);
  if (!Number.isFinite(executed) || executed <= 0) return false;

  const takeProfit = plan.takeProfit ?? null;
  const stopLoss = plan.stopLoss ?? null;
  const takeProfitHit = takeProfit
    ? executed >= takeProfit * (1 - PLAN_TOLERANCE_PCT)
    : false;
  const stopLossHit = stopLoss
    ? executed <= stopLoss * (1 + PLAN_TOLERANCE_PCT)
    : false;

  return takeProfitHit || stopLossHit;
};

export const useDisciplineScore = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { data: hasAdminRole } = useAdminRole();
  const { data: trades, isLoading: tradesLoading } = useTrades();
  const { data: portfolio } = usePortfolio();
  const { data: holdings } = useHoldings();

  const { data: profile } = useQuery({
    queryKey: ['profile-starting-balance', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('starting_balance')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data as { starting_balance: number } | null;
    },
    enabled: !!user,
  });

  const accountValue = useMemo(() => {
    if (!portfolio || !holdings) return 0;
    const investedValue = holdings.reduce((sum, holding) => {
      return sum + Number(holding.shares) * Number(holding.average_cost);
    }, 0);
    return Number(portfolio.cash_balance) + investedValue;
  }, [portfolio, holdings]);

  const discipline = useMemo(() => {
    const completedTrades = (trades || []).filter((trade) => trade.status === 'completed');
    const sortedTrades = completedTrades
      .slice()
      .sort((a, b) => getTradeTimestamp(a) - getTradeTimestamp(b));

    const plans = loadTradePlans(user?.id);
    const lastEntryBySymbol = new Map<string, Trade>();

    let plannedExits = 0;
    let adheredExits = 0;
    let revengeTrades = 0;
    let overLeverageTrades = 0;

    const startingBalance = Number(profile?.starting_balance || 10_000);
    const accountBase = Math.max(accountValue, startingBalance, 1);

    for (let i = 0; i < sortedTrades.length; i += 1) {
      const trade = sortedTrades[i];
      const tradeTime = getTradeTimestamp(trade);

      if (trade.trade_type === 'buy' || trade.trade_type === 'short') {
        lastEntryBySymbol.set(trade.symbol, trade);
        const totalAmount = Number(trade.total_amount || 0);
        if (totalAmount > accountBase * LEVERAGE_THRESHOLD) {
          overLeverageTrades += 1;
        }
      }

      if (trade.trade_type === 'sell' || trade.trade_type === 'cover') {
        const plan =
          plans[trade.id] ||
          (lastEntryBySymbol.get(trade.symbol)
            ? plans[lastEntryBySymbol.get(trade.symbol)!.id]
            : undefined);

        if (plan && (plan.takeProfit || plan.stopLoss)) {
          plannedExits += 1;
          if (didExitAtPlan(trade, plan)) {
            adheredExits += 1;
          }
        }

        if (isLossTrade(trade)) {
          const nextTrade = sortedTrades[i + 1];
          if (nextTrade) {
            const delta = getTradeTimestamp(nextTrade) - tradeTime;
            if (delta > 0 && delta <= REVENGE_WINDOW_MS) {
              revengeTrades += 1;
            }
          }
        }
      }
    }

    const planAdherenceRate =
      plannedExits === 0 ? 0.7 : adheredExits / Math.max(plannedExits, 1);

    const planMissPenalty = plannedExits === 0
      ? 10
      : Math.round((1 - planAdherenceRate) * 30);
    const revengePenalty = Math.min(revengeTrades * 12, 30);
    const leveragePenalty = Math.min(overLeverageTrades * 8, 20);

    const rawScore = 100 - planMissPenalty - revengePenalty - leveragePenalty;
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    const breakdown: DisciplineBreakdown = {
      plannedExits,
      adheredExits,
      planAdherenceRate,
      revengeTrades,
      overLeverageTrades,
      planMissPenalty,
      revengePenalty,
      leveragePenalty,
      startingBalance,
      accountValue: accountBase,
      tradeSample: completedTrades.length,
    };

    return { score, breakdown };
  }, [trades, user?.id, profile?.starting_balance, accountValue]);

  return {
    score: discipline.score,
    breakdown: discipline.breakdown,
    isAtRisk: !hasAdminRole && discipline.score < 50,
    loading: tradesLoading,
  };
};
