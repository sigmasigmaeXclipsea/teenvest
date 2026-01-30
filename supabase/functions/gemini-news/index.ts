import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  rateLimit, 
  RateLimitConfig, 
  sanitizeInput,
  validateSymbol,
  secureCorsHeaders,
  createRateLimitResponse,
  createErrorResponse,
  createSuccessResponse
} from "../_shared/security.ts";

const rateLimitConfig: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 15 };

interface NewsRequest {
  symbol?: string;
  market?: boolean;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: secureCorsHeaders })
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Validate request size (max 2KB)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 2048) {
      return createErrorResponse('Request too large', 413);
    }

    // Authentication check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return createErrorResponse('Authentication required', 401);
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
      return createErrorResponse('Invalid authentication', 401);
    }

    // Rate limiting per user
    const userId = claims.claims.sub as string;
    const rateLimitResult = rateLimit(userId, rateLimitConfig);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user: ${userId}`);
      return createRateLimitResponse(rateLimitResult.resetTime!);
    }

    const body: NewsRequest = await req.json()
    const { symbol, market } = body;

    // Validate inputs
    let validatedSymbol: string | null = null;
    if (symbol) {
      validatedSymbol = validateSymbol(symbol);
      if (!validatedSymbol) {
        return createErrorResponse('Invalid symbol format', 400);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return createErrorResponse('Service temporarily unavailable', 503);
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
    } else if (validatedSymbol) {
      prompt = `You are a financial news analyst. Provide the latest official news about ${validatedSymbol} stock.
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
      return createErrorResponse('Either symbol or market parameter is required', 400);
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
        return createErrorResponse('AI service rate limit. Please try again later.', 429);
      }
      const errorText = await response.text()
      console.error('AI gateway error:', response.status, errorText)
      return createErrorResponse('AI service temporarily unavailable', 502);
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    // Parse the JSON response - handle potential markdown code blocks
    let newsData
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        newsData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON array found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse news response:', parseError)
      newsData = []
    }
    
    return createSuccessResponse({ 
      success: true, 
      data: newsData,
      source: 'AI-powered'
    });

  } catch (error: any) {
    console.error('Error:', error)
    return createErrorResponse('An error occurred', 500);
  }
})
