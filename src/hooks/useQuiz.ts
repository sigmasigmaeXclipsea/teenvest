import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { localQuizQuestions } from '@/data/learningLocal';

export interface QuizQuestion {
  id: string;
  module_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  order_index: number;
}

export interface QuizResult {
  id: string;
  user_id: string;
  module_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

const LOCAL_RESULTS_KEY = 'local-quiz-results-v1';
const LOCAL_QUIZ_ENABLED = true;

const readLocalResults = (): QuizResult[] => {
  try {
    const raw = localStorage.getItem(LOCAL_RESULTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as QuizResult[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalResults = (results: QuizResult[]) => {
  localStorage.setItem(LOCAL_RESULTS_KEY, JSON.stringify(results));
};

export const useQuizQuestions = (moduleId: string | null) => {
  return useQuery({
    queryKey: ['quiz-questions', moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      if (LOCAL_QUIZ_ENABLED) {
        return localQuizQuestions
          .filter((q) => q.module_id === moduleId)
          .sort((a, b) => a.order_index - b.order_index);
      }

      return localQuizQuestions
        .filter((q) => q.module_id === moduleId)
        .sort((a, b) => a.order_index - b.order_index);
    },
    enabled: !!moduleId,
  });
};

export const useQuizResults = () => {
  const { user } = useAuth();
  const userId = user?.id ?? 'local-user';

  return useQuery({
    queryKey: ['quiz-results', user?.id],
    queryFn: async () => {
      if (LOCAL_QUIZ_ENABLED) {
        return readLocalResults().filter((result) => result.user_id === userId);
      }

      return readLocalResults().filter((result) => result.user_id === userId);
    },
    enabled: true,
  });
};

export const useSaveQuizResult = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? 'local-user';

  return useMutation({
    mutationFn: async ({ moduleId, score, totalQuestions }: { 
      moduleId: string; 
      score: number; 
      totalQuestions: number;
    }) => {
      if (LOCAL_QUIZ_ENABLED) {
        const results = readLocalResults();
        const existing = results.find((result) => result.user_id === userId && result.module_id === moduleId);
        const next: QuizResult = {
          id: existing?.id ?? `${userId}-${moduleId}`,
          user_id: userId,
          module_id: moduleId,
          score,
          total_questions: totalQuestions,
          completed_at: new Date().toISOString(),
        };

        const nextResults = existing
          ? results.map((result) =>
              result.user_id === userId && result.module_id === moduleId ? next : result
            )
          : [...results, next];
        writeLocalResults(nextResults);
        return;
      }

      const results = readLocalResults();
      const existing = results.find((result) => result.user_id === userId && result.module_id === moduleId);
      const next: QuizResult = {
        id: existing?.id ?? `${userId}-${moduleId}`,
        user_id: userId,
        module_id: moduleId,
        score,
        total_questions: totalQuestions,
        completed_at: new Date().toISOString(),
      };
      writeLocalResults(
        existing
          ? results.map((result) =>
              result.user_id === userId && result.module_id === moduleId ? next : result
            )
          : [...results, next]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-results'] });
    },
  });
};
