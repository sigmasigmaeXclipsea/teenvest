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
        throw new Error(error.message)
      }

      return data as NewsResponse
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
    enabled: !!(symbol || market),
  })
}
