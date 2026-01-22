import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface NewsItem {
  headline: string;
  summary: string;
  date: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface StockNewsData {
  news: NewsItem[];
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  keyInsight: string;
}

interface StockNewsProps {
  symbol: string;
  companyName: string;
}

const StockNews = ({ symbol, companyName }: StockNewsProps) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stock-news', symbol],
    queryFn: async (): Promise<StockNewsData> => {
      const { data, error } = await supabase.functions.invoke('stock-news', {
        body: { symbol, companyName }
      });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 1
  });

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-3 h-3 text-primary" />;
      case 'negative':
        return <TrendingDown className="w-3 h-3 text-destructive" />;
      default:
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Bullish</Badge>;
      case 'bearish':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Bearish</Badge>;
      default:
        return <Badge variant="outline">Neutral</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            Latest News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Fetching latest news...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            Latest News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Unable to fetch news</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            Latest News
          </CardTitle>
          {data?.marketSentiment && getSentimentBadge(data.marketSentiment)}
        </div>
        {data?.keyInsight && (
          <p className="text-sm text-muted-foreground mt-1">{data.keyInsight}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data?.news && data.news.length > 0 ? (
            data.news.map((item, index) => (
              <div key={index} className="border-b last:border-0 pb-3 last:pb-0">
                <div className="flex items-start gap-2">
                  {getSentimentIcon(item.sentiment)}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm leading-tight">{item.headline}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{item.summary}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{item.date}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">No recent news available</p>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()} 
          className="w-full mt-4"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh News
        </Button>
      </CardContent>
    </Card>
  );
};

export default StockNews;
