import type { LearningModule } from '@/hooks/useLearning';
import { localLearningModules } from '@/data/learningLocal';

export const getLessonByTitle = (modules: LearningModule[] | undefined, title: string) => {
  const source = modules && modules.length > 0 ? modules : localLearningModules;
  const match = source.find((module) => module.title === title);
  if (!match) return null;
  return { id: match.id, title: match.title };
};
