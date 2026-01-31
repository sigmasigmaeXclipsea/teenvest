import { useCallback, useMemo, useState } from 'react';

const STORAGE_KEY = 'scaffold-progress-v1';

type ScaffoldProgressState = Record<string, { completedSteps: string[]; updatedAt?: string }>;

const readStorage = (): ScaffoldProgressState => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ScaffoldProgressState;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStorage = (next: ScaffoldProgressState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

export const useScaffoldProgress = (moduleId?: string) => {
  const [progress, setProgress] = useState<ScaffoldProgressState>(() => readStorage());

  const moduleKey = moduleId || 'global';
  const moduleProgress = progress[moduleKey] || { completedSteps: [] };

  const isStepComplete = useCallback(
    (stepId: string) => moduleProgress.completedSteps.includes(stepId),
    [moduleProgress.completedSteps]
  );

  const markStepComplete = useCallback((stepId: string) => {
    setProgress((current) => {
      const existing = current[moduleKey]?.completedSteps ?? [];
      if (existing.includes(stepId)) return current;
      const next: ScaffoldProgressState = {
        ...current,
        [moduleKey]: {
          completedSteps: [...existing, stepId],
          updatedAt: new Date().toISOString(),
        },
      };
      writeStorage(next);
      return next;
    });
  }, [moduleKey]);

  const resetModule = useCallback(() => {
    setProgress((current) => {
      if (!current[moduleKey]) return current;
      const next = { ...current };
      delete next[moduleKey];
      writeStorage(next);
      return next;
    });
  }, [moduleKey]);

  return useMemo(() => ({
    completedSteps: moduleProgress.completedSteps,
    isStepComplete,
    markStepComplete,
    resetModule,
  }), [moduleProgress.completedSteps, isStepComplete, markStepComplete, resetModule]);
};
