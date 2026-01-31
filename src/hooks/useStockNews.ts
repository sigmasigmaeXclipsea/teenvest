import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface NewsItem {
  title: string
  summary: string
  source: string
  time: string
  url?: string
}

interface NewsResponse {
  success: boolean
  data?: NewsItem[]
  error?: string
  source: string
}

export const useStockNews = (symbol?: string, market?: boolean) => {
  return useQuery({
    queryKey: ['stock-news', symbol, market],
    queryFn: async (): Promise<NewsResponse> => {
      if (!symbol && !market) {
        throw new Error('Either symbol or market must be provided')
      }

      const { data, error } = await supabase.functions.invoke('gemini-news', {
        body: { symbol, market }
      })

      if (error) {
        // Handle rate limit errors gracefully
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          return {
            success: false,
            error: 'News is temporarily unavailable. Please try again in a moment.',
            source: 'rate-limited'
          }
        }
        throw new Error(error.message)
      }

      // Handle error responses from the function
      if (data?.error) {
        return {
          success: false,
          error: data.error,
          source: 'error'
        }
      }

      return data as NewsResponse
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry rate limit errors
      if (error?.message?.includes('429') || error?.message?.includes('Rate limit')) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!(symbol || market),
  })
}
