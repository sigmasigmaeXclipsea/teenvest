import { useMemo } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useLearningModules } from '@/hooks/useLearning';
import { useUserProgress } from '@/hooks/useLearning';
import { useQuizResults } from '@/hooks/useQuiz';
import { useTrades } from '@/hooks/useTrades';
import { usePlacementExam } from '@/hooks/usePlacementExam';
import {
  getBranchModules,
  getBranchForModule,
  type SkillBranchId,
  skillTreeBranches,
} from '@/lib/skillTree';

const isProfitableSell = (trade: any) => {
  const executedPrice = trade.executed_price ?? trade.price;
  const entryPrice = trade.entry_price;
  if (!entryPrice || !executedPrice) return false;
  return Number(executedPrice) > Number(entryPrice);
};

export const useSkillTreeProgress = () => {
  const { data: modules } = useLearningModules();
  const { data: progress } = useUserProgress();
  const { data: quizResults } = useQuizResults();
  const { data: trades } = useTrades();
  const { settings } = useSettings();
  const { data: hasAdminRole } = useAdminRole();
  const { passedTiers } = usePlacementExam();

  return useMemo(() => {
    const unlockAllEnabled = settings.unlockAll && hasAdminRole === true;
    const allModules = modules || [];
    const completedIds = new Set(
      (progress || []).filter((entry) => entry.completed).map((entry) => entry.module_id)
    );

    const foundationModules = getBranchModules(allModules, 'foundation');
    const foundationCompleted = foundationModules.filter((module) => completedIds.has(module.id)).length;
    const foundationComplete =
      foundationModules.length > 0 && foundationCompleted >= foundationModules.length;

    const completedTrades = (trades || []).filter((trade) => trade.status === 'completed');
    const completedTradesCount = completedTrades.length;
    const quizPass = (quizResults || []).some(
      (result) => (result.score / Math.max(1, result.total_questions)) * 100 >= 80
    );

    const sells = completedTrades
      .filter((trade) => trade.trade_type === 'sell')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    let profitableSellStreak = 0;
    for (const trade of sells) {
      if (isProfitableSell(trade)) {
        profitableSellStreak += 1;
      } else {
        break;
      }
    }

    const placementUnlocks = {
      technician: passedTiers.includes(3),
      fundamentalist: passedTiers.includes(4),
      riskManager: passedTiers.includes(4),
      psychologist: passedTiers.includes(5),
    };

    const computedUnlocks: Record<SkillBranchId, boolean> = {
      foundation: true,
      technician: placementUnlocks.technician || (foundationComplete && completedTradesCount >= 10),
      fundamentalist: placementUnlocks.fundamentalist || (foundationComplete && quizPass),
      riskManager: placementUnlocks.riskManager || (profitableSellStreak >= 5),
      psychologist: placementUnlocks.psychologist || (completedTradesCount >= 50),
    };

    const unlocks: Record<SkillBranchId, boolean> = unlockAllEnabled
      ? {
          foundation: true,
          technician: true,
          fundamentalist: true,
          riskManager: true,
          psychologist: true,
        }
      : computedUnlocks;

    const progressByBranch = Object.fromEntries(
      (skillTreeBranches || []).map((branch) => {
        const branchModules = getBranchModules(allModules, branch.id);
        const branchCompleted = branchModules.filter((module) => completedIds.has(module.id)).length;
        const percent = branchModules.length > 0 ? (branchCompleted / branchModules.length) * 100 : 0;
        return [branch.id, { total: branchModules.length, completed: branchCompleted, percent }];
      })
    ) as Record<SkillBranchId, { total: number; completed: number; percent: number }>;

    const moduleBranchMap = Object.fromEntries(
      allModules.map((module) => [module.id, getBranchForModule(module)])
    ) as Record<string, SkillBranchId>;

    const unmetCriteria: Record<SkillBranchId, string> = unlockAllEnabled
      ? {
          foundation: 'Unlocked',
          technician: 'Unlocked',
          fundamentalist: 'Unlocked',
          riskManager: 'Unlocked',
          psychologist: 'Unlocked',
        }
      : {
          foundation: 'Sign up to start learning.',
          technician: foundationComplete
            ? `${Math.max(0, 10 - completedTradesCount)} more completed trades to unlock.`
            : 'Complete all Foundation lessons to unlock.',
          fundamentalist: foundationComplete
            ? quizPass
              ? 'Unlocked'
              : 'Score 80%+ on any quiz to unlock.'
            : 'Complete all Foundation lessons to unlock.',
          riskManager: profitableSellStreak >= 5
            ? 'Unlocked'
            : `${Math.max(0, 5 - profitableSellStreak)} more consecutive profitable sells to unlock.`,
          psychologist: completedTradesCount >= 50
            ? 'Unlocked'
            : `${Math.max(0, 50 - completedTradesCount)} more trades to unlock.`,
        };

    if (placementUnlocks.technician) {
      unmetCriteria.technician = 'Unlocked via placement exam.';
    }
    if (placementUnlocks.fundamentalist) {
      unmetCriteria.fundamentalist = 'Unlocked via placement exam.';
    }
    if (placementUnlocks.riskManager) {
      unmetCriteria.riskManager = 'Unlocked via placement exam.';
    }
    if (placementUnlocks.psychologist) {
      unmetCriteria.psychologist = 'Unlocked via placement exam.';
    }

    return {
      modules: allModules,
      completedIds,
      foundationComplete,
      foundationCompleted,
      foundationTotal: foundationModules.length,
      completedTradesCount,
      profitableSellStreak,
      quizPass,
      unlocks,
      unmetCriteria,
      progressByBranch,
      moduleBranchMap,
    };
  }, [modules, progress, quizResults, trades, settings.unlockAll, hasAdminRole, passedTiers]);
};
