// Cost monitoring for AI usage
export interface CostMetrics {
  requests: number;
  tokens: number;
  estimatedCost: number;
}

// Rough cost estimates (in USD per 1M tokens)
const MODEL_COSTS = {
  "google/gemini-1.5-flash": {
    input: 0.075,  // $0.075 per 1M input tokens
    output: 0.15   // $0.15 per 1M output tokens
  },
  "google/gemini-3-flash-preview": {
    input: 0.15,   // $0.15 per 1M input tokens  
    output: 0.30   // $0.30 per 1M output tokens
  },
  "openai/gpt-3.5-turbo": {
    input: 0.50,   // $0.50 per 1M input tokens
    output: 1.50   // $1.50 per 1M output tokens
  },
  "anthropic/claude-haiku": {
    input: 0.25,   // $0.25 per 1M input tokens
    output: 1.25   // $1.25 per 1M output tokens
  }
};

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = MODEL_COSTS[model as keyof typeof MODEL_COSTS];
  if (!costs) return 0;
  
  const inputCost = (inputTokens / 1000000) * costs.input;
  const outputCost = (outputTokens / 1000000) * costs.output;
  
  return inputCost + outputCost;
}

export function logCostUsage(model: string, inputTokens: number, outputTokens: number) {
  const cost = calculateCost(model, inputTokens, outputTokens);
  console.log(`AI Usage - Model: ${model}, Input: ${inputTokens}, Output: ${outputTokens}, Cost: $${cost.toFixed(6)}`);
}

// Rough token estimation (1 token ≈ 4 characters for English)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
