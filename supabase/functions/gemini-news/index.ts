import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Authentication check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: authError } = await supabaseClient.auth.getClaims(token)
    
    if (authError || !claims?.claims?.sub) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { symbol, market }: NewsRequest = await req.json()

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
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
