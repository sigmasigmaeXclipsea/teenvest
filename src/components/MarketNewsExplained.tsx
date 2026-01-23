import { useState, useEffect } from 'react';
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  Globe,
  Building,
  Coins,
  Cpu,
  RefreshCw,
  Loader2,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useHoldings } from '@/hooks/usePortfolio';
import { supabase } from '@/integrations/supabase/client';

interface NewsItem {
  headline: string;
  category: 'macro' | 'earnings' | 'sector' | 'global' | 'tech' | 'crypto';
  summary: string;
  why_it_matters: string;
  affected_sectors: string[];
  impact_type: 'positive' | 'negative' | 'mixed' | 'neutral';
  learning_concept: string;
  icon: string;
}

const MarketNewsExplained = () => {
  const { data: holdings } = useHoldings();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [expandedNews, setExpandedNews] = useState<number | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-news-explained', {
        body: { userHoldings: holdings }
      });

      if (error) throw error;
      setNews(data.news || []);
      setLastUpdated(data.date || new Date().toLocaleDateString());
    } catch (err) {
      console.error('Failed to fetch market news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'macro': return <Globe className="w-4 h-4" />;
      case 'earnings': return <Building className="w-4 h-4" />;
      case 'tech': return <Cpu className="w-4 h-4" />;
      case 'crypto': return <Coins className="w-4 h-4" />;
      default: return <Newspaper className="w-4 h-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'bg-primary/10 text-primary border-primary/20';
      case 'negative': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'mixed': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="w-3 h-3" />;
      case 'negative': return <TrendingDown className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="w-5 h-5" />
              Market News Explained
            </CardTitle>
            <CardDescription>
              Today's market events in simple terms
              {lastUpdated && <span className="ml-1">· {lastUpdated}</span>}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchNews}
            disabled={loading}
            className="gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Fetching today's market news...</span>
          </div>
        )}

        {!loading && news.length === 0 && (
          <div className="text-center py-8">
            <Newspaper className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No market news available right now.</p>
            <Button variant="link" onClick={fetchNews} className="mt-2">
              Try refreshing
            </Button>
          </div>
        )}

        {!loading && news.length > 0 && (
          <div className="space-y-4">
            {news.map((item, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  expandedNews === index ? 'bg-secondary/50' : 'hover:bg-secondary/30'
                }`}
                onClick={() => setExpandedNews(expandedNews === index ? null : index)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{item.icon}</div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="outline" className="gap-1 text-xs">
                        {getCategoryIcon(item.category)}
                        <span className="capitalize">{item.category}</span>
                      </Badge>
                      <Badge className={`text-xs gap-1 ${getImpactColor(item.impact_type)}`}>
                        {getImpactIcon(item.impact_type)}
                        <span className="capitalize">{item.impact_type}</span>
                      </Badge>
                    </div>

                    <h4 className="font-semibold mb-1">{item.headline}</h4>
                    
                    {expandedNews === index ? (
                      <div className="space-y-3 mt-3">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">What happened: </span>
                          <span className="text-sm">{item.summary}</span>
                        </div>

                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <span className="text-sm font-medium">🎯 Why it matters: </span>
                          <span className="text-sm">{item.why_it_matters}</span>
                        </div>

                        {item.affected_sectors && item.affected_sectors.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground">Affected sectors:</span>
                            {item.affected_sectors.map((sector, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {sector}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-primary">
                          <Lightbulb className="w-4 h-4" />
                          <span className="font-medium">Learn about:</span>
                          <span>{item.learning_concept}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${
                    expandedNews === index ? 'rotate-90' : ''
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

export default MarketNewsExplained;
