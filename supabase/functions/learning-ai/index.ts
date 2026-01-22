import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quizResults, completedModules, allModules } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a supportive learning coach for teens learning about investing and finance. Your job is to analyze their quiz performance and learning progress, then create a personalized learning plan.

IMPORTANT GUIDELINES:
- Be encouraging and motivating - teens learn better when they feel confident!
- Use simple, relatable language (think how a cool older sibling would explain things)
- Identify specific weak areas based on quiz scores
- Suggest focused mini-lessons for improvement
- Use emojis to keep it fun 🎯📚
- Keep explanations under 300 words total

Format your response like this:
1. **Your Learning Progress**: Brief encouraging overview
2. **Strengths**: What topics you've mastered
3. **Areas to Focus On**: 2-3 specific topics that need work (based on low quiz scores)
4. **Personalized Learning Plan**: 3-4 specific exercises or concepts to study
5. **Pro Tip**: One actionable tip to improve learning

Remember: Learning about money is a superpower! Make it feel achievable.`;

    const userMessage = `Please analyze my learning progress and create a personalized plan:

**Completed Modules**: ${completedModules?.length || 0} out of ${allModules?.length || 0}

**Quiz Results**:
${quizResults && quizResults.length > 0 
  ? quizResults.map((r: any) => `- Module: ${r.module_title || 'Unknown'} | Score: ${r.score}/${r.total_questions} (${Math.round(r.score/r.total_questions*100)}%)`).join('\n')
  : 'No quizzes taken yet'}

**Available Modules**:
${allModules?.map((m: any) => `- ${m.title}: ${m.description}`).join('\n') || 'No modules available'}

Please give me personalized learning recommendations based on my performance!`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const recommendations = data.choices?.[0]?.message?.content || "Unable to generate recommendations at this time.";

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Learning AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
