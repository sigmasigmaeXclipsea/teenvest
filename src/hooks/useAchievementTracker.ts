import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievements, useUserAchievements } from './useAchievements';
import { useHoldings, usePortfolio } from './usePortfolio';
import { useTrades } from './useTrades';
import { useWatchlist } from './useWatchlist';
import { useUserProgress } from './useLearning';
import { toast } from 'sonner';

/**
 * Hook that automatically checks and awards achievements based on user activity.
 * Call this in a top-level component (like DashboardLayout) to enable auto-tracking.
 */
export const useAchievementTracker = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: achievements } = useAchievements();
  const { data: userAchievements } = useUserAchievements();
  const { data: holdings } = useHoldings();
  const { data: portfolio } = usePortfolio();
  const { data: trades } = useTrades();
  const { data: watchlist } = useWatchlist();
  const { data: userProgress } = useUserProgress();

  const earnAchievement = useCallback(async (achievementId: string, achievementName: string, icon: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementId,
        });
      
      // Ignore duplicate errors
      if (error && error.code !== '23505') {
        console.error('Error earning achievement:', error);
        return;
      }
      
      // Only show toast and invalidate if successfully inserted
      if (!error) {
        toast.success(`🏆 Achievement Unlocked: ${achievementName}!`, {
          description: 'Check your achievements to see all your badges!',
          duration: 5000,
        });
        queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      }
    } catch (err) {
      console.error('Achievement error:', err);
    }
  }, [user, queryClient]);

  // Check achievements whenever relevant data changes
  useEffect(() => {
    if (!user || !achievements || !userAchievements) return;

    const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id));
    
    achievements.forEach(achievement => {
      // Skip if already earned
      if (earnedIds.has(achievement.id)) return;
      
      let qualified = false;
      
      switch (achievement.requirement_type) {
        case 'trades':
          qualified = (trades?.length || 0) >= achievement.requirement_value;
          break;
          
        case 'holdings':
          qualified = (holdings?.length || 0) >= achievement.requirement_value;
          break;
          
        case 'watchlist':
          qualified = (watchlist?.length || 0) >= achievement.requirement_value;
          break;
          
        case 'lessons':
          const completedLessons = userProgress?.filter(p => p.completed)?.length || 0;
          qualified = completedLessons >= achievement.requirement_value;
          break;
          
        case 'portfolio_value':
          if (portfolio && holdings) {
            // Estimate portfolio value (cash + holdings at avg cost)
            const cashBalance = Number(portfolio.cash_balance) || 0;
            const holdingsValue = holdings.reduce((sum, h) => {
              return sum + (Number(h.shares) * Number(h.average_cost));
            }, 0);
            const totalValue = cashBalance + holdingsValue;
            qualified = totalValue >= achievement.requirement_value;
          }
          break;
          
        case 'quiz_score':
          // Check if any quiz has been passed
          // This would need quiz_results data
          break;
      }
      
      if (qualified) {
        earnAchievement(achievement.id, achievement.name, achievement.icon);
      }
    });
  }, [user, achievements, userAchievements, trades, holdings, watchlist, userProgress, portfolio, earnAchievement]);
};

export default useAchievementTracker;