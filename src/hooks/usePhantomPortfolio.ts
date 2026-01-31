import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buildPhantomPortfolio } from '@/lib/phantomPortfolio';

export type PhantomHolding = {
  symbol: string;
  companyName: string;
  shares: number;
  averageCost: number;
};

export type PhantomPortfolioState = {
  startingBalance: number;
  cashBalance: number;
  holdings: PhantomHolding[];
  lastUpdatedAt?: string;
  source?: {
    type: 'copy' | 'manual';
    targetId?: string;
    ratio?: number;
    guruValue?: number;
  };
};

const STORAGE_PREFIX = 'teenvest.phantomPortfolio';

const readJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn('Failed to parse phantom portfolio:', error);
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const getStorageKey = (userId: string) => `${STORAGE_PREFIX}.${userId}`;

const normalizeBalance = (value: number) => (Number.isFinite(value) ? value : 0);

const normalizeHoldings = (holdings: unknown): PhantomHolding[] => {
  if (!Array.isArray(holdings)) return [];
  return holdings
    .map((holding) => {
      const symbol = typeof holding?.symbol === 'string' ? holding.symbol : '';
      const companyName =
        typeof holding?.companyName === 'string'
          ? holding.companyName
          : symbol;
      const shares = Number(holding?.shares);
      const averageCost = Number(holding?.averageCost);
      if (!symbol || !Number.isFinite(shares) || shares <= 0) return null;
      return {
        symbol,
        companyName,
        shares,
        averageCost: Number.isFinite(averageCost) && averageCost > 0 ? averageCost : 0,
      };
    })
    .filter((holding): holding is PhantomHolding => Boolean(holding));
};

const normalizeState = (
  raw: PhantomPortfolioState | null,
  startingBalance: number
): PhantomPortfolioState => {
  const safeStart = normalizeBalance(raw?.startingBalance ?? startingBalance);
  const safeCash = normalizeBalance(raw?.cashBalance ?? safeStart);
  return {
    startingBalance: safeStart,
    cashBalance: safeCash,
    holdings: normalizeHoldings(raw?.holdings),
    lastUpdatedAt: raw?.lastUpdatedAt ?? new Date().toISOString(),
    source: raw?.source ?? { type: 'manual' },
  };
};

const createDefaultState = (startingBalance: number): PhantomPortfolioState => {
  const safeBalance = normalizeBalance(startingBalance);
  return {
    startingBalance: safeBalance,
    cashBalance: safeBalance,
    holdings: [],
    lastUpdatedAt: new Date().toISOString(),
    source: { type: 'manual' },
  };
};

export const usePhantomPortfolio = (initialBalance: number) => {
  const { user } = useAuth();
  const [state, setState] = useState<PhantomPortfolioState>(() =>
    createDefaultState(initialBalance)
  );

  useEffect(() => {
    if (!user) return;
    const key = getStorageKey(user.id);
    const stored = readJson<PhantomPortfolioState | null>(key, null);
    const next = stored ? normalizeState(stored, initialBalance) : createDefaultState(initialBalance);
    setState(next);
    writeJson(key, next);
  }, [user?.id, initialBalance]);

  const persist = useCallback(
    (next: PhantomPortfolioState) => {
      if (!user) return;
      setState(next);
      writeJson(getStorageKey(user.id), next);
    },
    [user]
  );

  const reset = useCallback(
    (balance?: number) => {
      if (!user) return;
      const next = createDefaultState(balance ?? state.startingBalance);
      persist(next);
    },
    [persist, state.startingBalance, user]
  );

  const syncFromCopy = useCallback(
    ({
      guruId,
      guruValue,
      userValue,
    }: {
      guruId: string;
      guruValue: number;
      userValue: number;
    }) => {
      if (!user) return;
      const phantom = buildPhantomPortfolio({
        guruId,
        guruValue,
        userValue,
        holdingsCount: 6,
      });

      const holdings: PhantomHolding[] = phantom.holdings.map((holding) => ({
        symbol: holding.symbol,
        companyName: holding.companyName,
        shares: holding.phantomShares,
        averageCost: holding.price,
      }));

      const next: PhantomPortfolioState = {
        startingBalance: phantom.userValue,
        cashBalance: phantom.cashRemainder,
        holdings,
        lastUpdatedAt: new Date().toISOString(),
        source: {
          type: 'copy',
          targetId: guruId,
          ratio: phantom.ratio,
          guruValue: phantom.guruValue,
        },
      };

      persist(next);
    },
    [persist, user]
  );

  const executeTrade = useCallback(
    ({
      symbol,
      companyName,
      tradeType,
      shares,
      price,
    }: {
      symbol: string;
      companyName: string;
      tradeType: 'buy' | 'sell';
      shares: number;
      price: number;
    }) => {
      if (!user) return { ok: false, error: 'Not authenticated' };
      if (!symbol || !Number.isFinite(shares) || shares <= 0) {
        return { ok: false, error: 'Enter a valid share amount.' };
      }
      if (!Number.isFinite(price) || price <= 0) {
        return { ok: false, error: 'Invalid price.' };
      }

      const total = shares * price;
      const holdings = [...state.holdings];
      const existingIndex = holdings.findIndex((holding) => holding.symbol === symbol);
      const existing = existingIndex >= 0 ? holdings[existingIndex] : null;

      if (tradeType === 'buy') {
        if (state.cashBalance < total) {
          return { ok: false, error: 'Insufficient phantom cash.' };
        }
        const nextShares = (existing?.shares ?? 0) + shares;
        const nextAvg =
          existing
            ? ((existing.shares * existing.averageCost + total) / nextShares)
            : price;
        const nextHolding: PhantomHolding = {
          symbol,
          companyName,
          shares: nextShares,
          averageCost: nextAvg,
        };
        if (existingIndex >= 0) holdings[existingIndex] = nextHolding;
        else holdings.push(nextHolding);

        persist({
          ...state,
          cashBalance: state.cashBalance - total,
          holdings,
          lastUpdatedAt: new Date().toISOString(),
          source: { type: 'manual' },
        });
        return { ok: true };
      }

      if (!existing || existing.shares < shares) {
        return { ok: false, error: 'Not enough phantom shares to sell.' };
      }

      const remainingShares = existing.shares - shares;
      if (remainingShares <= 0) {
        holdings.splice(existingIndex, 1);
      } else {
        holdings[existingIndex] = { ...existing, shares: remainingShares };
      }

      persist({
        ...state,
        cashBalance: state.cashBalance + total,
        holdings,
        lastUpdatedAt: new Date().toISOString(),
        source: { type: 'manual' },
      });

      return { ok: true };
    },
    [persist, state, user]
  );

  const totalHoldings = useMemo(() => state.holdings.length, [state.holdings.length]);

  return {
    state,
    totalHoldings,
    reset,
    syncFromCopy,
    executeTrade,
  };
};
