import { useCallback, useMemo, useState } from 'react';

const STORAGE_KEY = 'placement-exam-v1';

export type PlacementExamResult = {
  placementIndex: number;
  score: number;
  total: number;
  highestTierPassed: number;
  passedTiers: number[];
  completedAt: string;
};

const readStorage = (): PlacementExamResult | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlacementExamResult;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Number.isFinite(parsed.placementIndex)) return null;
    if (!Array.isArray(parsed.passedTiers)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeStorage = (result: PlacementExamResult | null) => {
  if (typeof window === 'undefined') return;
  if (!result) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
};

export const usePlacementExam = () => {
  const [result, setResult] = useState<PlacementExamResult | null>(() => readStorage());

  const saveResult = useCallback((next: PlacementExamResult) => {
    setResult(next);
    writeStorage(next);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    writeStorage(null);
  }, []);

  const placementIndex = result?.placementIndex ?? 0;
  const passedTiers = result?.passedTiers ?? [];
  const highestTierPassed = result?.highestTierPassed ?? 0;

  return useMemo(() => ({
    placementIndex,
    passedTiers,
    highestTierPassed,
    result,
    saveResult,
    clearResult,
  }), [placementIndex, passedTiers, highestTierPassed, result, saveResult, clearResult]);
};
