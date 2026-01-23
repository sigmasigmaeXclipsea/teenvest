import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Lightbulb, 
  BookOpen, 
  ChevronRight,
  RefreshCw,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTrades } from '@/hooks/useTrades';
import { usePortfolio, useHoldings } from '@/hooks/usePortfolio';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

interface PatternInsight {
  id: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  explanation: string;
  action: string;
  related_lesson: string;
  icon: string;
}

const MistakeFeed = () => {
  const { user } = useAuth();
  const { data: trades } = useTrades();
  const { data: portfolio } = usePortfolio();
  const { data: holdings } = useHoldings();
  const [patterns, setPatterns] = useState<PatternInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  // Fetch user's starting balance
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('starting_balance')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const analyzePatterns = async () => {
    if (!trades || trades.length === 0) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mistake-analysis-ai', {
        body: { 
          trades,
          holdings,
          portfolio,
          startingBalance: profile?.starting_balance || 10000
        }
      });

      if (error) throw error;
      setPatterns(data.patterns || []);
    } catch (err) {
      console.error('Failed to analyze patterns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trades && trades.length >= 3 && patterns.length === 0) {
      analyzePatterns();
    }
  }, [trades]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <XCircle className="w-4 h-4" />;
      case 'medium': return <AlertTriangle className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  // Calculate a "trading health" score
  const healthScore = patterns.length === 0 ? 100 : 
    Math.max(0, 100 - (patterns.filter(p => p.severity === 'high').length * 25) - 
    (patterns.filter(p => p.severity === 'medium').length * 10) -
    (patterns.filter(p => p.severity === 'low').length * 5));

  if (!trades || trades.length < 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Pattern Analysis
          </CardTitle>
          <CardDescription>Personalized insights about your trading habits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-2">Make a few more trades to unlock AI analysis!</p>
            <p className="text-sm text-muted-foreground">We need at least 3 trades to identify patterns.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Pattern Analysis
            </CardTitle>
            <CardDescription>Personalized insights about your trading habits</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={analyzePatterns}
            disabled={loading}
            className="gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trading Health Score */}
        <div className="p-4 rounded-lg bg-secondary/50 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Trading Health Score</span>
            <span className={`text-lg font-bold ${
              healthScore >= 80 ? 'text-primary' : 
              healthScore >= 50 ? 'text-amber-500' : 'text-destructive'
            }`}>
              {healthScore}/100
            </span>
          </div>
          <Progress value={healthScore} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {healthScore >= 80 ? "You're developing great trading habits! 🎉" :
             healthScore >= 50 ? "Good progress! Some areas to improve. 💪" :
             "Keep learning! Every trader starts somewhere. 📚"}
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Analyzing your trading patterns...</span>
          </div>
        )}

        {/* Patterns list */}
        {!loading && patterns.length === 0 && (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 mx-auto text-primary mb-3" />
            <p className="font-medium text-primary">Looking good! 🎉</p>
            <p className="text-sm text-muted-foreground">No concerning patterns detected in your recent trades.</p>
          </div>
        )}

        {!loading && patterns.length > 0 && (
          <div className="space-y-3">
            {patterns.map((pattern) => (
              <div 
                key={pattern.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  expandedPattern === pattern.id ? 'bg-secondary/50' : 'hover:bg-secondary/30'
                }`}
                onClick={() => setExpandedPattern(expandedPattern === pattern.id ? null : pattern.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{pattern.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs ${getSeverityColor(pattern.severity)}`}>
                        {getSeverityIcon(pattern.severity)}
                        <span className="ml-1 capitalize">{pattern.severity}</span>
                      </Badge>
                      <span className="font-semibold text-sm">{pattern.title}</span>
                    </div>
                    
                    {expandedPattern === pattern.id ? (
                      <div className="space-y-3 mt-3">
                        <p className="text-sm">{pattern.explanation}</p>
                        
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <span className="text-sm font-medium">💡 What you can do: </span>
                          <span className="text-sm">{pattern.action}</span>
                        </div>

                        <Link 
                          to="/learn"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <BookOpen className="w-4 h-4" />
                          Learn about: {pattern.related_lesson}
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {pattern.explanation}
                      </p>
                    )}
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${
                    expandedPattern === pattern.id ? 'rotate-90' : ''
                  }`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MistakeFeed;
