import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { localLearningModules } from '@/data/learningLocal';
import type { InteractiveBlock } from '@/components/learn/InteractiveBlockRenderer';

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  content: string;
  order_index: number;
  duration_minutes: number;
  created_at: string;
  category?: 'Foundations' | 'Strategy' | 'Advanced';
  interactive_blocks?: InteractiveBlock[] | null;
}

export interface UserProgress {
  id: string;
  user_id: string;
  module_id: string;
  completed: boolean;
  completed_at: string | null;
}

const LOCAL_PROGRESS_KEY = 'local-learning-progress-v1';
const LOCAL_LEARNING_ENABLED = true;

const readLocalProgress = (): UserProgress[] => {
  try {
    const raw = localStorage.getItem(LOCAL_PROGRESS_KEY);
    const parsed = raw ? (JSON.parse(raw) as UserProgress[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalProgress = (progress: UserProgress[]) => {
  localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress));
};

export const useLearningModules = () => {
  return useQuery({
    queryKey: ['learning-modules'],
    queryFn: async () => {
      if (LOCAL_LEARNING_ENABLED) {
        return localLearningModules as LearningModule[];
      }

      return localLearningModules as LearningModule[];
    },
  });
};

export const useUserProgress = () => {
  const { user } = useAuth();
  const userId = user?.id ?? 'local-user';

  return useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: async () => {
      if (LOCAL_LEARNING_ENABLED) {
        return readLocalProgress().filter((entry) => entry.user_id === userId);
      }

      return readLocalProgress().filter((entry) => entry.user_id === userId);
    },
    enabled: true,
  });
};

export const useCompleteModule = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? 'local-user';

  return useMutation({
    mutationFn: async (moduleId: string) => {
      if (LOCAL_LEARNING_ENABLED) {
        const progress = readLocalProgress();
        const existing = progress.find((entry) => entry.user_id === userId && entry.module_id === moduleId);
        const nextEntry: UserProgress = {
          id: existing?.id ?? `${userId}-${moduleId}`,
          user_id: userId,
          module_id: moduleId,
          completed: true,
          completed_at: new Date().toISOString(),
        };

        const nextProgress = existing
          ? progress.map((entry) => (entry.user_id === userId && entry.module_id === moduleId ? nextEntry : entry))
          : [...progress, nextEntry];
        writeLocalProgress(nextProgress);
        return;
      }

      const progress = readLocalProgress();
      const existing = progress.find((entry) => entry.user_id === userId && entry.module_id === moduleId);
      const nextEntry: UserProgress = {
        id: existing?.id ?? `${userId}-${moduleId}`,
        user_id: userId,
        module_id: moduleId,
        completed: true,
        completed_at: new Date().toISOString(),
      };
      writeLocalProgress(
        existing
          ? progress.map((entry) => (entry.user_id === userId && entry.module_id === moduleId ? nextEntry : entry))
          : [...progress, nextEntry]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
    },
  });
};
