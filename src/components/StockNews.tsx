import React from 'react'
import { ExternalLink, Clock, Globe, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useStockNews } from '@/hooks/useStockNews'

interface StockNewsProps {
  symbol?: string
  market?: boolean
  className?: string
}

const StockNews: React.FC<StockNewsProps> = ({ symbol, market, className = '' }) => {
  const { data: newsData, isLoading, error } = useStockNews(symbol, market)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {market ? 'Market News' : `${symbol} News`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !newsData?.success || !newsData.data) {
    const isRateLimited = newsData?.source === 'rate-limited' || 
                          newsData?.error?.includes('Rate limit') ||
                          error?.message?.includes('429');
    
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {market ? 'Market News' : `${symbol} News`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant={isRateLimited ? 'default' : 'destructive'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isRateLimited 
                ? 'News temporarily unavailable due to high demand. Please refresh in a moment.'
                : (error?.message || newsData?.error || 'Unable to load news at this time.')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {market ? 'Market News' : `${symbol} News`}
          </div>
          <Badge variant="outline" className="text-xs">
            {newsData.source}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {newsData.data.map((item, index) => (
            <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
              <h3 className="font-semibold text-sm mb-2 leading-tight">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-2 leading-relaxed">
                {item.summary}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{item.time}</span>
                  <span>•</span>
                  <span>{item.source}</span>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Read more
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default StockNews
