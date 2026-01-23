import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, RefreshCw, Sparkles, Target, TrendingUp, BookOpen, Lightbulb, CheckCircle, AlertCircle, Rocket } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorMessages';

interface LearningAIProps {
  quizResults: any[];
  completedModules: any[];
  allModules: any[];
}

const LearningAI = ({ quizResults, completedModules, allModules }: LearningAIProps) => {
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  const { toast } = useToast();

  // Calculate learning stats
  const completedCount = completedModules.length;
  const totalModules = allModules.length;
  const progressPercent = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;
  
  // Find weak areas from quiz results
  const weakAreas = quizResults
    .filter(r => r.score < r.total_questions * 0.7)
    .map(r => r.module_title)
    .filter(Boolean);

  // Auto-load recommendations if user has some progress
  useEffect(() => {
    if (!hasAutoLoaded && completedCount > 0 && !recommendations) {
      getRecommendations();
      setHasAutoLoaded(true);
    }
  }, [completedCount, hasAutoLoaded, recommendations]);

  const getRecommendations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('learning-ai', {
        body: { quizResults, completedModules, allModules },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setRecommendations(data.recommendations);
    } catch (error: any) {
      console.error('Learning AI error:', error);
      toast({
        title: 'AI Recommendations Failed',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedRecommendations = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Handle bold headers with **
      if (line.includes('**') && (line.includes(':') || line.match(/^\d+\./))) {
        const cleanLine = line.replace(/\*\*/g, '');
        if (cleanLine.toLowerCase().includes('progress')) {
          return (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20"
            >
              <Target className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="font-bold text-lg">{cleanLine}</span>
            </motion.div>
          );
        }
        if (cleanLine.toLowerCase().includes('strength') || cleanLine.toLowerCase().includes('mastered')) {
          return (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 mt-5 mb-2 p-2 bg-emerald-500/10 rounded-lg"
            >
              <TrendingUp className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{cleanLine}</span>
            </motion.div>
          );
        }
        if (cleanLine.toLowerCase().includes('focus') || cleanLine.toLowerCase().includes('area') || cleanLine.toLowerCase().includes('improve')) {
          return (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 mt-5 mb-2 p-2 bg-amber-500/10 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span className="font-semibold text-amber-600 dark:text-amber-400">{cleanLine}</span>
            </motion.div>
          );
        }
        if (cleanLine.toLowerCase().includes('plan') || cleanLine.toLowerCase().includes('next') || cleanLine.toLowerCase().includes('recommend')) {
          return (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 mt-5 mb-2 p-2 bg-blue-500/10 rounded-lg"
            >
              <Rocket className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <span className="font-semibold text-blue-600 dark:text-blue-400">{cleanLine}</span>
            </motion.div>
          );
        }
        if (cleanLine.toLowerCase().includes('tip') || cleanLine.toLowerCase().includes('pro')) {
          return (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 mt-5 mb-2 p-2 bg-amber-500/10 rounded-lg"
            >
              <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span className="font-semibold text-amber-600 dark:text-amber-400">{cleanLine}</span>
            </motion.div>
          );
        }
        return <p key={i} className="font-semibold mt-3 mb-1">{cleanLine}</p>;
      }
      
      // Handle list items
      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        return (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-start gap-2 ml-4 mb-2"
          >
            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground text-sm">
              {line.replace(/^[-•]\s*/, '')}
            </p>
          </motion.div>
        );
      }
      
      // Handle numbered items
      if (/^\d+\./.test(line.trim())) {
        const num = line.match(/^(\d+)\./)?.[1];
        return (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 ml-2 mb-3"
          >
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center flex-shrink-0 text-sm">
              {num}
            </span>
            <p className="text-foreground/90 text-sm pt-0.5">
              {line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '')}
            </p>
          </motion.div>
        );
      }
      
      // Regular paragraph
      if (line.trim()) {
        return <p key={i} className="mb-2 text-foreground/80 text-sm">{line.replace(/\*\*/g, '')}</p>;
      }
      
      return null;
    });
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-base">Your Study Plan</CardTitle>
          </div>
          {recommendations && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={getRecommendations}
              disabled={isLoading}
              className="gap-1 h-8 px-2"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        
        {/* Progress Overview */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium text-primary">{progressPercent.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="p-2 bg-secondary/50 rounded-lg text-center">
            <p className="text-lg font-bold text-primary">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="p-2 bg-secondary/50 rounded-lg text-center">
            <p className="text-lg font-bold text-foreground">{totalModules - completedCount}</p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
        </div>

        {/* Weak Areas Warning */}
        {weakAreas.length > 0 && (
          <div className="mt-3 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Areas to Review</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {weakAreas.slice(0, 3).map((area, i) => (
                <Badge key={i} variant="outline" className="text-xs border-amber-500/30 text-amber-600 dark:text-amber-400">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <AnimatePresence mode="wait">
          {!recommendations && !isLoading && (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-4"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Get a personalized learning plan based on your progress
              </p>
              <Button onClick={getRecommendations} size="sm" className="gap-2">
                <Brain className="w-4 h-4" />
                Generate Plan
              </Button>
            </motion.div>
          )}
          
          {isLoading && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                <Brain className="absolute inset-0 m-auto w-5 h-5 text-primary" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Analyzing your progress...</p>
            </motion.div>
          )}
          
          {recommendations && !isLoading && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <ScrollArea className="h-[350px] pr-3" type="always">
                <div className="space-y-1">
                  {renderFormattedRecommendations(recommendations)}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default LearningAI;
