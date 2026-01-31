import { useEffect, useState } from 'react';
import {
  BookOpen,
  Lightbulb,
  Trophy,
  Clock,
  Sparkles,
  Newspaper,
  Brain,
  CheckCircle,
  Award,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useLearningModules, useUserProgress } from '@/hooks/useLearning';
import { useQuizResults } from '@/hooks/useQuiz';
import { useXP } from '@/contexts/XPContext';
import LearningAI from '@/components/LearningAI';
import AIAssistantCard from '@/components/AIAssistantCard';
import XPStore from '@/components/XPStore';
import PortfolioTimeline from '@/components/PortfolioTimeline';
import MistakeFeed from '@/components/MistakeFeed';
import MarketNewsExplained from '@/components/MarketNewsExplained';
import GameLayer from '@/components/GameLayer';
import SkillTree from '@/components/learn/SkillTree';
import { usePlacementExam } from '@/hooks/usePlacementExam';
import { Link } from 'react-router-dom';

<<<<<<< HEAD
type LearnPageProps = {
  initialTab?: 'learn' | 'insights';
=======
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Difficulty levels for modules
const getDifficulty = (index: number, totalModules: number): { label: string; color: string } => {
  const foundationsEnd = Math.floor(totalModules * 0.3); // First 30%
  const strategyEnd = Math.floor(totalModules * 0.6); // Next 30%
  
  if (index < foundationsEnd) return { label: 'Beginner', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
  if (index < strategyEnd) return { label: 'Intermediate', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' };
  return { label: 'Advanced', color: 'bg-red-500/10 text-red-600 dark:text-red-400' };
};

type LearningModule = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  category?: string;
  interactive_blocks?: unknown[];
};

type LessonCategory = {
  name: 'Foundations' | 'Strategy' | 'Advanced';
  icon: typeof BookOpen;
  color: string;
  description: string;
  startIndex?: number;
  endIndex?: number;
  modules?: LearningModule[];
};

const fallbackCategories = (totalModules: number): LessonCategory[] => {
  const foundationsEnd = Math.floor(totalModules * 0.3);
  const strategyEnd = Math.floor(totalModules * 0.6);
  
  return [
    { 
      name: 'Foundations', 
      icon: BookOpen, 
      startIndex: 0, 
      endIndex: foundationsEnd, 
      color: 'from-emerald-500 to-teal-500',
      description: 'Master the basics of investing'
    },
    { 
      name: 'Strategy', 
      icon: Target, 
      startIndex: foundationsEnd, 
      endIndex: strategyEnd, 
      color: 'from-amber-500 to-orange-500',
      description: 'Build your investment toolkit'
    },
    { 
      name: 'Advanced', 
      icon: Trophy, 
      startIndex: strategyEnd, 
      endIndex: totalModules, 
      color: 'from-purple-500 to-pink-500',
      description: 'Professional-level strategies'
    },
  ];
>>>>>>> a398009a4477ed85581aae27611f08e45fdfc99c
};

const LearnPage = ({ initialTab = 'learn' }: LearnPageProps) => {
  const [activeTab, setActiveTab] = useState<'learn' | 'insights'>(initialTab);
  const { data: modules, isLoading: modulesLoading } = useLearningModules();
  const { data: progress, isLoading: progressLoading } = useUserProgress();
  const { data: quizResults } = useQuizResults();
  const { xp, addXP, loading: xpLoading } = useXP();
  const { result: placementResult } = usePlacementExam();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handlePurchase = async (cost: number) => {
    await addXP(-cost);
  };

  const completedCount = progress?.filter(p => p.completed).length || 0;
  const totalModules = modules?.length || 0;
  const qualifiedQuizCount = quizResults?.filter(r => (r.score / r.total_questions) >= 0.8).length || 0;

  if (modulesLoading || progressLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 animate-bounce" />
            Loading your learning journey...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'learn' | 'insights')} className="space-y-6">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="learn" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Learn
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learn">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Placement Exam</CardTitle>
                    {placementResult && (
                      <Badge variant="outline" className="gap-1">
                        <Trophy className="w-3 h-3 text-amber-500" />
                        Lesson {placementResult.placementIndex}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Take a short SAT-style exam to find your best starting lesson.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/learn/placement">
                    <Button className="w-full" variant="outline">
                      {placementResult ? 'Retake Placement Exam' : 'Start Placement Exam'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              <SkillTree />
            </div>
            <div className="space-y-6">
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg shadow-primary/20">
                      <Brain className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        AI Learning Coach
                        <Sparkles className="w-4 h-4 text-primary" />
                      </CardTitle>
                      <CardDescription>Your personalized study guide</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <LearningAI
                quizResults={quizResults?.map(r => ({
                  ...r,
                  module_title: modules?.find(m => m.id === r.module_id)?.title,
                })) || []}
                completedModules={progress?.filter(p => p.completed) || []}
                allModules={modules || []}
              />

              <AIAssistantCard
                title="Ask AI Tutor"
                description="Get instant answers about investing"
                suggestedQuestions={[
                  "What's the difference between stocks and bonds?",
                  "How do I know if a stock is a good investment?",
                  "Explain diversification like I'm 15",
                ]}
              />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Your Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-sm">Lessons Completed</span>
                    </div>
                    <span className="font-bold">{completedCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span className="text-sm">Qualified Quizzes (80%+)</span>
                    </div>
                    <span className="font-bold">{qualifiedQuizCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="text-sm">Total XP</span>
                    </div>
                    <span className="font-bold">{xpLoading ? '...' : xp}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {completedCount}/{totalModules} lessons complete
                  </div>
                </CardContent>
              </Card>

              <XPStore currentXP={xp} onPurchase={handlePurchase} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Lightbulb className="w-6 h-6" />
                Insights & Challenges
              </h1>
              <p className="text-muted-foreground">
                Learn from your trades, track your progress, and stay informed
              </p>
            </div>

            <Tabs defaultValue="challenges" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="challenges" className="gap-1 text-xs sm:text-sm">
                  <Trophy className="w-4 h-4" />
                  <span className="hidden sm:inline">Challenges</span>
                </TabsTrigger>
                <TabsTrigger value="timeline" className="gap-1 text-xs sm:text-sm">
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Timeline</span>
                </TabsTrigger>
                <TabsTrigger value="patterns" className="gap-1 text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Patterns</span>
                </TabsTrigger>
                <TabsTrigger value="news" className="gap-1 text-xs sm:text-sm">
                  <Newspaper className="w-4 h-4" />
                  <span className="hidden sm:inline">News</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="challenges" className="space-y-6">
                <GameLayer />
              </TabsContent>

              <TabsContent value="timeline" className="space-y-6">
                <PortfolioTimeline />
              </TabsContent>

              <TabsContent value="patterns" className="space-y-6">
                <MistakeFeed />
              </TabsContent>

              <TabsContent value="news" className="space-y-6">
                <MarketNewsExplained />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default LearnPage;
