import { useState } from 'react';
import { Brain, Loader2, RefreshCw, Sparkles, Target, TrendingUp, BookOpen, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LearningAIProps {
  quizResults: any[];
  completedModules: any[];
  allModules: any[];
}

const LearningAI = ({ quizResults, completedModules, allModules }: LearningAIProps) => {
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
        description: error.message || 'Could not get recommendations. Please try again.',
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
            <div key={i} className="flex items-center gap-2 mb-4 p-3 bg-primary/10 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg">{cleanLine}</span>
            </div>
          );
        }
        if (cleanLine.toLowerCase().includes('strength') || cleanLine.toLowerCase().includes('mastered')) {
          return (
            <div key={i} className="flex items-center gap-2 mt-4 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-semibold text-primary">{cleanLine}</span>
            </div>
          );
        }
        if (cleanLine.toLowerCase().includes('focus') || cleanLine.toLowerCase().includes('area')) {
          return (
            <div key={i} className="flex items-center gap-2 mt-4 mb-2">
              <Target className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-amber-500">{cleanLine}</span>
            </div>
          );
        }
        if (cleanLine.toLowerCase().includes('plan') || cleanLine.toLowerCase().includes('learning')) {
          return (
            <div key={i} className="flex items-center gap-2 mt-4 mb-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-500">{cleanLine}</span>
            </div>
          );
        }
        if (cleanLine.toLowerCase().includes('tip') || cleanLine.toLowerCase().includes('pro')) {
          return (
            <div key={i} className="flex items-center gap-2 mt-4 mb-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-yellow-500">{cleanLine}</span>
            </div>
          );
        }
        return <p key={i} className="font-semibold mt-3 mb-1">{cleanLine}</p>;
      }
      
      // Handle list items
      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        return (
          <p key={i} className="ml-4 mb-1 text-muted-foreground">
            {line}
          </p>
        );
      }
      
      // Handle numbered items
      if (/^\d+\./.test(line.trim())) {
        return (
          <p key={i} className="ml-2 mb-2 text-foreground/90">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      }
      
      // Regular paragraph
      if (line.trim()) {
        return <p key={i} className="mb-2 text-foreground/80">{line.replace(/\*\*/g, '')}</p>;
      }
      
      return null;
    });
  };

  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-card to-blue-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            <CardTitle>AI Learning Coach</CardTitle>
          </div>
          {recommendations && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={getRecommendations}
              disabled={isLoading}
              className="gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
        <CardDescription>
          Get personalized learning recommendations based on your progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!recommendations && !isLoading && (
          <div className="text-center py-6">
            <Brain className="w-12 h-12 mx-auto text-blue-500/50 mb-3" />
            <p className="text-muted-foreground mb-4">
              Let AI create a personalized learning plan just for you!
            </p>
            <Button onClick={getRecommendations} className="gap-2 bg-blue-500 hover:bg-blue-600">
              <Sparkles className="w-4 h-4" />
              Get My Learning Plan
            </Button>
          </div>
        )}
        
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-muted-foreground">Creating your learning plan...</span>
          </div>
        )}
        
        {recommendations && !isLoading && (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-1">
              {renderFormattedRecommendations(recommendations)}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default LearningAI;
