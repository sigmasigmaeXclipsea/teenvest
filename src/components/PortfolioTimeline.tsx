import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Sparkles, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTrades, Trade } from '@/hooks/useTrades';
import { useHoldings } from '@/hooks/usePortfolio';
import { supabase } from '@/integrations/supabase/client';

interface TradeInsight {
  trade_id: string;
  context: string;
  market_insight: string;
  lesson_learned: string;
  sentiment: 'positive' | 'neutral' | 'learning_moment';
}

const PortfolioTimeline = () => {
  const { data: trades, isLoading: tradesLoading } = useTrades();
  const { data: holdings } = useHoldings();
  const [insights, setInsights] = useState<TradeInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);

  useEffect(() => {
    if (trades && trades.length > 0 && insights.length === 0) {
      fetchInsights();
    }
  }, [trades]);

  const fetchInsights = async () => {
    if (!trades || trades.length === 0) return;
    
    setLoadingInsights(true);
    try {
      const { data, error } = await supabase.functions.invoke('portfolio-timeline-ai', {
        body: { 
          trades: trades.slice(0, 10),
          holdings 
        }
      });

      if (error) throw error;
      setInsights(data.insights || []);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const getInsightForTrade = (tradeId: string): TradeInsight | undefined => {
    return insights.find(i => i.trade_id === tradeId);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-primary/10 text-primary border-primary/20';
      case 'learning_moment': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  if (tradesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Portfolio Timeline
          </CardTitle>
          <CardDescription>Your trading journey will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Make your first trade to start building your timeline!</p>
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
              <Clock className="w-5 h-5" />
              Portfolio Timeline
            </CardTitle>
            <CardDescription>Your trading journey with AI insights</CardDescription>
          </div>
          {loadingInsights && (
            <Badge variant="outline" className="gap-1">
              <Sparkles className="w-3 h-3" />
              Analyzing...
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-6">
            {trades.slice(0, 10).map((trade, index) => {
              const insight = getInsightForTrade(trade.id);
              const isExpanded = expandedTrade === trade.id;
              const isBuy = trade.trade_type?.toLowerCase() === 'buy';

              return (
                <div key={trade.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isBuy ? 'bg-primary border-primary' : 'bg-destructive border-destructive'
                  }`}>
                    {isBuy ? (
                      <ArrowUpRight className="w-3 h-3 text-primary-foreground" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-destructive-foreground" />
                    )}
                  </div>

                  {/* Trade card */}
                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isExpanded ? 'bg-secondary/50 border-primary/30' : 'bg-card hover:bg-secondary/30'
                    }`}
                    onClick={() => setExpandedTrade(isExpanded ? null : trade.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={isBuy ? 'default' : 'destructive'} className="text-xs">
                            {trade.trade_type?.toUpperCase() || 'TRADE'}
                          </Badge>
                          <span className="font-semibold">{trade.symbol}</span>
                          <span className="text-sm text-muted-foreground">
                            {trade.shares} shares @ ${Number(trade.price).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(trade.created_at), 'MMM d, yyyy h:mm a')} · {formatDistanceToNow(new Date(trade.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${Number(trade.total_amount).toFixed(2)}
                        </div>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {/* AI Insight (expanded) */}
                    {isExpanded && insight && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">AI Analysis</span>
                          <Badge className={`text-xs ${getSentimentColor(insight.sentiment)}`}>
                            {insight.sentiment === 'learning_moment' ? '📚 Learning Moment' : 
                             insight.sentiment === 'positive' ? '✨ Great Move' : '📊 Neutral'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">What you did: </span>
                            {insight.context}
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Market context: </span>
                            {insight.market_insight}
                          </div>
                          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <span className="font-medium">💡 Lesson: </span>
                            {insight.lesson_learned}
                          </div>
                        </div>
                      </div>
                    )}

                    {isExpanded && !insight && loadingInsights && (
                      <div className="mt-4 pt-4 border-t flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Generating insight...</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {trades.length > 10 && (
          <div className="mt-6 text-center">
            <Button variant="outline" size="sm">
              View All {trades.length} Trades
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioTimeline;
