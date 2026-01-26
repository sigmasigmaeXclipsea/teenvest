import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  content: string;
  order_index: number;
  duration_minutes: number;
  created_at: string;
  interactive_blocks?: any[] | null;
}

export interface UserProgress {
  id: string;
  user_id: string;
  module_id: string;
  completed: boolean;
  completed_at: string | null;
}

export const useLearningModules = () => {
  return useQuery({
    queryKey: ['learning-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_modules')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return (data as LearningModule[]) || [];
    },
  });
};

export const useUserProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return (data as UserProgress[]) || [];
    },
    enabled: !!user,
  });
};

export const useCompleteModule = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (moduleId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          completed: true,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,module_id',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
    },
  });
};
