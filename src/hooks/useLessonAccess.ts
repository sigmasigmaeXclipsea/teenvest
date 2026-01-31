import { useMemo } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useLearningModules, useUserProgress } from '@/hooks/useLearning';
import { usePlacementExam } from '@/hooks/usePlacementExam';
import type { LearningModule } from '@/hooks/useLearning';

export const useLessonAccess = () => {
  const { data: modules } = useLearningModules();
  const { data: progress } = useUserProgress();
  const { placementIndex } = usePlacementExam();
  const { settings } = useSettings();
  const { data: hasAdminRole } = useAdminRole();

  return useMemo(() => {
    const unlockAllEnabled = hasAdminRole === true;
    if (!modules || modules.length === 0) {
      return {
        modules: [],
        placementIndex,
        maxCompletedIndex: 0,
        allowedMaxIndex: placementIndex || 1,
        nextRequiredLesson: null as LearningModule | null,
        canAccessLesson: () => true,
      };
    }

    if (unlockAllEnabled) {
      return {
        modules,
        placementIndex,
        maxCompletedIndex: 0,
        allowedMaxIndex: modules.length,
        nextRequiredLesson: null as LearningModule | null,
        canAccessLesson: () => true,
      };
    }

    const completedIds = new Set(
      (progress || []).filter((entry) => entry.completed).map((entry) => entry.module_id)
    );
    const maxCompletedIndex = modules.reduce((max, module) => {
      if (completedIds.has(module.id)) {
        return Math.max(max, module.order_index);
      }
      return max;
    }, 0);

    const allowedMaxIndex = Math.max(placementIndex, maxCompletedIndex + 1);
    const nextRequiredIndex = placementIndex > maxCompletedIndex
      ? placementIndex
      : Math.min(maxCompletedIndex + 1, modules.length);
    const nextRequiredLesson =
      modules.find((module) => module.order_index === nextRequiredIndex) || null;

    const canAccessLesson = (module: LearningModule) =>
      module.order_index <= allowedMaxIndex;

    return {
      modules,
      placementIndex,
      maxCompletedIndex,
      allowedMaxIndex,
      nextRequiredLesson,
      canAccessLesson,
    };
  }, [modules, progress, placementIndex, hasAdminRole]);
};
