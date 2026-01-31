import { useMemo } from 'react';
import { useLearningModules, useUserProgress } from '@/hooks/useLearning';
import { useSkillTreeProgress } from '@/hooks/useSkillTreeProgress';
import { getBranchForModule } from '@/lib/skillTree';

export type ScaffoldingLevel = 'full' | 'partial' | 'independent';

export const useScaffoldingLevel = (moduleId?: string) => {
  const { data: modules } = useLearningModules();
  const { data: progress } = useUserProgress();
  const {
    unlocks,
    foundationComplete,
    moduleBranchMap,
  } = useSkillTreeProgress();

  return useMemo(() => {
    if (!moduleId || !modules) return 'full' as ScaffoldingLevel;
    const module = modules.find((item) => item.id === moduleId);
    if (!module) return 'full' as ScaffoldingLevel;

    const branchId = moduleBranchMap?.[moduleId] ?? getBranchForModule(module);
    const isCompleted = (progress || []).some(
      (entry) => entry.module_id === moduleId && entry.completed
    );

    if (branchId === 'foundation') {
      if (foundationComplete) return 'independent';
      if (isCompleted) return 'partial';
      return 'full';
    }

    if (unlocks?.[branchId]) return 'independent';
    if (isCompleted) return 'partial';
    return 'full';
  }, [moduleId, modules, progress, unlocks, foundationComplete, moduleBranchMap]);
};
