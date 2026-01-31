export type TradePlan = {
  takeProfit?: number | null;
  stopLoss?: number | null;
  createdAt: string;
  symbol: string;
  tradeType: 'buy' | 'sell' | 'short' | 'cover';
};

export type TradePlanMap = Record<string, TradePlan>;

const getPlansStorageKey = (userId?: string | null) =>
  userId ? `teenvest.tradePlans.${userId}` : null;

const readPlans = (key: string): TradePlanMap => {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(key);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as TradePlanMap;
  } catch (error) {
    console.warn('Failed to parse trade plans:', error);
    return {};
  }
};

const writePlans = (key: string, plans: TradePlanMap) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(plans));
};

export const loadTradePlans = (userId?: string | null): TradePlanMap => {
  const key = getPlansStorageKey(userId);
  if (!key) return {};
  return readPlans(key);
};

export const saveTradePlan = (userId: string, tradeId: string, plan: TradePlan) => {
  const key = getPlansStorageKey(userId);
  if (!key) return;
  const plans = readPlans(key);
  plans[tradeId] = plan;
  writePlans(key, plans);
};

export const removeTradePlan = (userId: string, tradeId: string) => {
  const key = getPlansStorageKey(userId);
  if (!key) return;
  const plans = readPlans(key);
  if (!(tradeId in plans)) return;
  delete plans[tradeId];
  writePlans(key, plans);
};
