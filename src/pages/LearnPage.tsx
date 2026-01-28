import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, Clock, CheckCircle, ChevronRight, GraduationCap, Award, 
  Sparkles, Trophy, Flame, Target, Brain, Star, Zap, Lock, Search, TrendingUp, BarChart3, HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useLearningModules, useUserProgress, type LearningModule } from '@/hooks/useLearning';
import { useQuizResults } from '@/hooks/useQuiz';
import { useXP } from '@/contexts/XPContext';
import { getRankFromXP } from '@/lib/ranks';
import LearningAI from '@/components/LearningAI';
import AIAssistantCard from '@/components/AIAssistantCard';
import XPStore from '@/components/XPStore';

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
};

const LearnPage = () => {
  const [search, setSearch] = useState('');
  const { data: modules, isLoading: modulesLoading } = useLearningModules();
  const { data: progress, isLoading: progressLoading } = useUserProgress();
  const { data: quizResults } = useQuizResults();

  const isCompleted = (moduleId: string) => {
    return progress?.some(p => p.module_id === moduleId && p.completed);
  };

  const getQuizScore = (moduleId: string) => {
    return quizResults?.find(r => r.module_id === moduleId);
  };

  const completedCount = progress?.filter(p => p.completed).length || 0;
  const totalModules = modules?.length || 0;
  const progressPercent = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;
  
  // Calculate XP based on quiz performance - need 80%+ score for 50 XP reward
  const calculateXP = () => {
    let totalXP = 0;
    quizResults?.forEach(result => {
      const scorePercent = (result.score / result.total_questions) * 100;
      if (scorePercent >= 80) {
        totalXP += 50; // 50 XP for 80%+ score
      }
    });
    return totalXP;
  };
  
  const baseXP = calculateXP();
  const { xp, addXP, loading: xpLoading } = useXP();
  const rank = getRankFromXP(xp).name;

  // Categories: prefer explicit module.category when present
  const categories = useMemo<LessonCategory[]>(() => {
    if (!modules || modules.length === 0) return [];
    const hasCategory = modules.some((module) => !!module.category);
    if (!hasCategory) return fallbackCategories(totalModules);

    return [
      {
        name: 'Foundations',
        icon: BookOpen,
        color: 'from-emerald-500 to-teal-500',
        description: 'Master the basics of investing',
        modules: modules.filter((module) => module.category === 'Foundations'),
      },
      {
        name: 'Strategy',
        icon: Target,
        color: 'from-amber-500 to-orange-500',
        description: 'Build your investment toolkit',
        modules: modules.filter((module) => module.category === 'Strategy'),
      },
      {
        name: 'Advanced',
        icon: Trophy,
        color: 'from-purple-500 to-pink-500',
        description: 'Professional-level strategies',
        modules: modules.filter((module) => module.category === 'Advanced'),
      },
    ];
  }, [modules, totalModules]);

  // All lessons are now accessible; no locking logic

  const handlePurchase = async (cost: number) => {
    await addXP(-cost);
  };

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
      <motion.div 
        className="space-y-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Hero Header */}
        <motion.div variants={item} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-background p-8 border">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Learn to Invest</h1>
                  <p className="text-muted-foreground">Master investing with interactive lessons</p>
                </div>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur px-4 py-2 rounded-xl border shadow-sm">
                <Trophy className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Rank</p>
                  <p className="font-bold">{xpLoading ? '...' : rank}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur px-4 py-2 rounded-xl border shadow-sm">
                <Zap className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">XP Earned</p>
                  <p className="font-bold">{xp}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur px-4 py-2 rounded-xl border shadow-sm">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="font-bold">{completedCount}/{totalModules}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        {totalModules > 20 && (
          <motion.div variants={item} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search lessons by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 max-w-md"
            />
          </motion.div>
        )}

        {/* Main Progress Bar */}
        <motion.div variants={item}>
          <Card className="bg-gradient-to-r from-card to-card/50 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold">Your Learning Journey</span>
                </div>
                <span className="text-sm font-medium text-primary">{progressPercent.toFixed(0)}% Complete</span>
              </div>
              <div className="relative">
                <Progress value={progressPercent} className="h-3" />
                {/* Milestone markers */}
                <div className="absolute top-1/2 -translate-y-1/2 left-1/4 w-3 h-3 rounded-full bg-background border-2 border-primary" />
                <div className="absolute top-1/2 -translate-y-1/2 left-1/2 w-3 h-3 rounded-full bg-background border-2 border-primary" />
                <div className="absolute top-1/2 -translate-y-1/2 left-3/4 w-3 h-3 rounded-full bg-background border-2 border-primary" />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Start</span>
                <span>Foundations</span>
                <span>Strategy</span>
                <span>Expert</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content - Lessons */}
          <div className="lg:col-span-2 space-y-8">
            {/* Learning Path Categories */}
            {categories.map((category, catIndex) => {
              const allInCategory = category.modules
                ? category.modules
                : modules?.slice(category.startIndex, category.endIndex) || [];
              const categoryModules = search.trim()
                ? allInCategory.filter(
                    (m) =>
                      m.title.toLowerCase().includes(search.toLowerCase()) ||
                      m.description.toLowerCase().includes(search.toLowerCase())
                  )
                : allInCategory;
              const categoryCompleted = allInCategory.filter(m => isCompleted(m.id)).length;
              
              if (categoryModules.length === 0) return null;
              
              return (
                <motion.div key={category.name} variants={item}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${category.color}`}>
                      <category.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{category.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {categoryCompleted}/{allInCategory.length} lessons completed • {category.description}
                      </p>
                    </div>
                  </div>

                  <ScrollArea className={allInCategory.length > 8 ? 'h-[420px] pr-4' : ''}>
                    <div className="space-y-3">
                    {categoryModules.map((module, localIndex) => {
                      const globalIndex = modules?.findIndex((x) => x.id === module.id) ?? category.startIndex + localIndex;
                      const completed = isCompleted(module.id);
                      const quizScore = getQuizScore(module.id);
                      const locked = false; // No locking: all lessons accessible
                      const difficulty = getDifficulty(globalIndex, totalModules);
                      const isPerfectScore = quizScore && quizScore.score === quizScore.total_questions;
                      const interactiveBlocks = Array.isArray(module.interactive_blocks)
                        ? (module.interactive_blocks as Array<{ type?: string }>)
                        : [];
                      const interactiveTypes = new Set(
                        interactiveBlocks
                          .map((block) => block?.type)
                          .filter((type): type is string => Boolean(type))
                      );
                      
                      return (
                        <Link to={`/learn/${module.id}`}>
                          <motion.div
                            whileHover={{ scale: 1.01, x: 4 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <Card 
                              className={`transition-all cursor-pointer ${
                                completed 
                                  ? 'border-primary/50 bg-gradient-to-r from-primary/5 to-transparent hover:shadow-lg hover:border-primary' 
                                  : 'hover:shadow-lg hover:border-primary/30'
                              }`}
                            >
                              <CardContent className="p-5">
                                <div className="flex items-center gap-4">
                                  {/* Status Icon */}
                                  <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold transition-all ${
                                    completed 
                                      ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20' 
                                      : 'bg-secondary text-foreground'
                                  }`}>
                                    {completed ? (
                                      <CheckCircle className="w-7 h-7" />
                                    ) : (
                                      globalIndex + 1
                                    )}
                                    {isPerfectScore && (
                                      <div className="absolute -top-1 -right-1">
                                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                      <Badge className={`text-xs ${difficulty.color} border-0`}>
                                        {difficulty.label}
                                      </Badge>
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        {module.duration_minutes} min
                                      </span>
                                      {interactiveBlocks.length > 0 && (
                                        <Badge className="gap-1 text-xs bg-primary/10 text-primary border-0">
                                          <Sparkles className="w-3 h-3" />
                                          Interactive
                                        </Badge>
                                      )}
                                      {quizScore && (
                                        <Badge variant="secondary" className="gap-1 text-xs">
                                          <Award className="w-3 h-3" />
                                          {quizScore.score}/{quizScore.total_questions}
                                        </Badge>
                                      )}
                                      {completed && !isPerfectScore && (
                                        <Badge className="gap-1 text-xs bg-primary/10 text-primary border-0">
                                          <CheckCircle className="w-3 h-3" />
                                          Done
                                        </Badge>
                                      )}
                                    </div>
                                    <h3 className="text-lg font-semibold mb-0.5 line-clamp-1">{module.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{module.description}</p>
                                    {interactiveBlocks.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                                        {interactiveTypes.has('mini_quiz') && (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/70 px-2 py-0.5">
                                            <HelpCircle className="w-3 h-3" />
                                            Quick quiz
                                          </span>
                                        )}
                                        {interactiveTypes.has('trade_sim') && (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/70 px-2 py-0.5">
                                            <TrendingUp className="w-3 h-3" />
                                            Trade sim
                                          </span>
                                        )}
                                        {interactiveTypes.has('interactive_chart') && (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/70 px-2 py-0.5">
                                            <BarChart3 className="w-3 h-3" />
                                            Interactive chart
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Arrow / XP */}
                                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    {completed && (
                                      <Badge variant="outline" className="text-xs gap-1 text-primary border-primary/30">
                                        <Zap className="w-3 h-3" />
                                        +100 XP
                                      </Badge>
                                    )}
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </Link>
                      );
                    })}
                    </div>
                  </ScrollArea>
                </motion.div>
              );
            })}


            {(!modules || modules.length === 0) && (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold mb-2">No lessons available yet</h3>
                  <p className="text-muted-foreground">
                    New lessons are being added. Check back soon!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <motion.div variants={item} className="space-y-6">
            {/* AI Learning Coach - Prominent */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <CardHeader className="relative">
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

            {/* Quick AI Tutor */}
            <AIAssistantCard 
              title="Ask AI Tutor"
              description="Get instant answers about investing"
              suggestedQuestions={[
                "What's the difference between stocks and bonds?",
                "How do I know if a stock is a good investment?",
                "Explain diversification like I'm 15"
              ]}
            />

            {/* Quick Stats Card */}
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
                  <span className="font-bold">
                    {quizResults?.filter(r => (r.score / r.total_questions) >= 0.8).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm">Total XP</span>
                  </div>
                  <span className="font-bold">{xp}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* XP Store */}
          <motion.div variants={item}>
            <XPStore currentXP={xp} onPurchase={handlePurchase} />
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default LearnPage;
