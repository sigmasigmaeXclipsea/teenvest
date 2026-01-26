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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol, market }: NewsRequest = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get API key from database
    const { data: config, error: configError } = await supabase
      .from('ai_config')
      .select('gemini_api_key')
      .eq('service', 'gemini')
      .single()

    if (configError || !config?.gemini_api_key) {
      throw new Error('Gemini API key not configured')
    }

    const apiKey = config.gemini_api_key
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-exp:generateContent'

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
      Current date: ${new Date().toLocaleDateString()}`
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
      Current date: ${new Date().toLocaleDateString()}`
    } else {
      throw new Error('Either symbol or market parameter is required')
    }

    const response = await fetch(`${geminiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      // Parse the JSON response from Gemini
      const newsText = data.candidates[0].content.parts[0].text
      const newsData = JSON.parse(newsText)
      
      return new Response(JSON.stringify({ 
        success: true, 
        data: newsData,
        source: 'gemini-flash-3'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      throw new Error('Invalid response from Gemini API')
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
