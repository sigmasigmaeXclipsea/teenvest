import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

export const useQuizQuestions = (moduleId: string | null) => {
  return useQuery({
    queryKey: ['quiz-questions', moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      
      // Parse options from JSONB
      return (data || []).map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      })) as QuizQuestion[];
    },
    enabled: !!moduleId,
  });
};

export const useQuizResults = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quiz-results', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return (data as QuizResult[]) || [];
    },
    enabled: !!user,
  });
};

export const useSaveQuizResult = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ moduleId, score, totalQuestions }: { 
      moduleId: string; 
      score: number; 
      totalQuestions: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('quiz_results')
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          score,
          total_questions: totalQuestions,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,module_id',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-results'] });
    },
  });
};
