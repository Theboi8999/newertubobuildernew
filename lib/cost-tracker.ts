export interface CostEstimate { promptTokens: number; completionTokens: number; estimatedCostUSD: number }

const INPUT_PER_1K = 0.003
const OUTPUT_PER_1K = 0.015

export function estimateCost(promptTokens: number, completionTokens: number): CostEstimate {
  const cost = (promptTokens / 1000) * INPUT_PER_1K + (completionTokens / 1000) * OUTPUT_PER_1K
  return { promptTokens, completionTokens, estimatedCostUSD: Math.round(cost * 10000) / 10000 }
}

export function estimateTokensFromText(text: string): number {
  return Math.ceil(text.length / 4)
}
