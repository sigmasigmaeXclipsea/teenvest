import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsRequest {
  symbol?: string;
  market?: boolean;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol, market }: NewsRequest = await req.json()

    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY')
    
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY is not configured')
    }

    let prompt = ''
    
    if (market) {
      prompt = `You are a financial news analyst. Provide the latest official news about the overall stock market today. 
      Focus on major indices (S&P 500, Dow Jones, NASDAQ), economic indicators, and market-moving events.
      Return exactly 5 news items in JSON format with the following structure:
      [
        {
          "title": "News headline",
          "summary": "Brief summary (under 100 words)",
          "source": "Official source name",
          "time": "Time published (e.g., '2 hours ago')",
          "url": "Official URL if available"
        }
      ]
      Ensure all news is from official sources like Bloomberg, Reuters, CNBC, WSJ, etc.
      Current date: ${new Date().toLocaleDateString()}
      
      IMPORTANT: Return ONLY the JSON array, no markdown formatting or code blocks.`
    } else if (symbol) {
      prompt = `You are a financial news analyst. Provide the latest official news about ${symbol.toUpperCase()} stock.
      Focus on company announcements, earnings, analyst ratings, and significant business developments.
      Return exactly 5 news items in JSON format with the following structure:
      [
        {
          "title": "News headline",
          "summary": "Brief summary (under 100 words)",
          "source": "Official source name",
          "time": "Time published (e.g., '2 hours ago')",
          "url": "Official URL if available"
        }
      ]
      Ensure all news is from official sources like Bloomberg, Reuters, CNBC, WSJ, company press releases, etc.
      Current date: ${new Date().toLocaleDateString()}
      
      IMPORTANT: Return ONLY the JSON array, no markdown formatting or code blocks.`
    } else {
      throw new Error('Either symbol or market parameter is required')
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GOOGLE_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash-lite',
        messages: [
          { role: 'user', content: prompt }
        ],
      })
    })

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.',
          success: false 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const errorText = await response.text()
      console.error('AI gateway error:', response.status, errorText)
      throw new Error('AI service temporarily unavailable')
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    // Parse the JSON response - handle potential markdown code blocks
    let newsData
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        newsData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON array found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse news response:', parseError, 'Content:', content)
      newsData = []
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: newsData,
      source: 'AI-powered'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})