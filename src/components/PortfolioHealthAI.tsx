import { useState } from 'react';
import { Brain, Loader2, RefreshCw, Sparkles, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PortfolioHealthAIProps {
  holdings: any[];
  cashBalance: number;
  totalValue: number;
  startingBalance: number;
}

const PortfolioHealthAI = ({ holdings, cashBalance, totalValue, startingBalance }: PortfolioHealthAIProps) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getAnalysis = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('portfolio-health-ai', {
        body: { holdings, cashBalance, totalValue, startingBalance },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setAnalysis(data.analysis);
    } catch (error: any) {
      console.error('Portfolio AI error:', error);
      toast({
        title: 'AI Analysis Failed',
        description: error.message || 'Could not analyze portfolio. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedAnalysis = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Handle bold headers with **
      if (line.includes('**') && (line.includes(':') || line.match(/^\d+\./))) {
        const cleanLine = line.replace(/\*\*/g, '');
        if (cleanLine.toLowerCase().includes('health score')) {
          return (
            <div key={i} className="flex items-center gap-2 mb-4 p-3 bg-primary/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg">{cleanLine}</span>
            </div>
          );
        }
        if (cleanLine.toLowerCase().includes('doing well') || cleanLine.toLowerCase().includes('strength')) {
          return (
            <div key={i} className="flex items-center gap-2 mt-4 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-semibold text-primary">{cleanLine}</span>
            </div>
          );
        }
        if (cleanLine.toLowerCase().includes('improve') || cleanLine.toLowerCase().includes('weakness')) {
          return (
            <div key={i} className="flex items-center gap-2 mt-4 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-amber-500">{cleanLine}</span>
            </div>
          );
        }
        if (cleanLine.toLowerCase().includes('action') || cleanLine.toLowerCase().includes('step')) {
          return (
            <div key={i} className="flex items-center gap-2 mt-4 mb-2">
              <Lightbulb className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-500">{cleanLine}</span>
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
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <CardTitle>AI Portfolio Health</CardTitle>
          </div>
          {analysis && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={getAnalysis}
              disabled={isLoading}
              className="gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
        <CardDescription>
          Get personalized, teen-friendly advice on your portfolio
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!analysis && !isLoading && (
          <div className="text-center py-6">
            <Brain className="w-12 h-12 mx-auto text-primary/50 mb-3" />
            <p className="text-muted-foreground mb-4">
              Let AI analyze your portfolio and give you tips to improve!
            </p>
            <Button onClick={getAnalysis} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Analyze My Portfolio
            </Button>
          </div>
        )}
        
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Analyzing your portfolio...</span>
          </div>
        )}
        
        {analysis && !isLoading && (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-1">
              {renderFormattedAnalysis(analysis)}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioHealthAI;
