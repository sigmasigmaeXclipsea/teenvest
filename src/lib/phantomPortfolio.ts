import { mockStocks, type Stock } from '@/data/mockStocks';

export type PhantomHolding = {
  symbol: string;
  companyName: string;
  price: number;
  weight: number;
  guruValue: number;
  phantomValue: number;
  phantomShares: number;
};

export type PhantomPortfolio = {
  ratio: number;
  guruValue: number;
  userValue: number;
  holdings: PhantomHolding[];
  phantomTotal: number;
  cashRemainder: number;
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pickHoldings = (seed: number, count: number) => {
  const rng = mulberry32(seed);
  const pool = [...mockStocks];
  const picks: Stock[] = [];
  const safeCount = Math.min(count, pool.length);

  for (let i = 0; i < safeCount; i += 1) {
    const index = Math.floor(rng() * pool.length);
    picks.push(pool[index]);
    pool.splice(index, 1);
  }

  return picks;
};

export const buildPhantomPortfolio = ({
  guruId,
  guruValue,
  userValue,
  holdingsCount = 6,
}: {
  guruId: string;
  guruValue: number;
  userValue: number;
  holdingsCount?: number;
}): PhantomPortfolio => {
  const safeGuruValue = Math.max(0, guruValue);
  const safeUserValue = Math.max(0, userValue);

  if (!guruId || safeGuruValue <= 0 || safeUserValue <= 0) {
    return {
      ratio: 0,
      guruValue: safeGuruValue,
      userValue: safeUserValue,
      holdings: [],
      phantomTotal: 0,
      cashRemainder: safeUserValue,
    };
  }

  const ratio = safeUserValue / safeGuruValue;
  const seed = hashString(guruId);
  const holdings = pickHoldings(seed, holdingsCount);
  const rng = mulberry32(seed + 17);

  const rawWeights = holdings.map(() => Math.max(0.05, rng()));
  const weightSum = rawWeights.reduce((sum, value) => sum + value, 0);

  const positions = holdings.map((stock, index) => {
    const weight = rawWeights[index] / weightSum;
    const guruAllocation = safeGuruValue * weight;
    const phantomAllocation = guruAllocation * ratio;
    const price = Number(stock.price) || 1;

    return {
      symbol: stock.symbol,
      companyName: stock.companyName,
      price,
      weight,
      guruValue: guruAllocation,
      phantomValue: phantomAllocation,
      phantomShares: phantomAllocation / price,
    };
  });

  const phantomTotal = positions.reduce((sum, position) => sum + position.phantomValue, 0);
  const cashRemainder = Math.max(0, safeUserValue - phantomTotal);

  return {
    ratio,
    guruValue: safeGuruValue,
    userValue: safeUserValue,
    holdings: positions,
    phantomTotal,
    cashRemainder,
  };
};
