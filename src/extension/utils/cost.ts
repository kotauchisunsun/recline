import type { Model } from "@extension/api/types";


export function calculateApiCost(
  model: Model,
  inputTokens: number,
  outputTokens: number,
  cacheCreationInputTokens?: number,
  cacheReadInputTokens?: number
): number {
  const modelCacheWritesPrice = model.cacheWritesPrice;
  let cacheWritesCost = 0;
  if (cacheCreationInputTokens != null && modelCacheWritesPrice != null) {
    cacheWritesCost = (modelCacheWritesPrice / 1_000_000) * cacheCreationInputTokens;
  }
  const modelCacheReadsPrice = model.cacheReadsPrice;
  let cacheReadsCost = 0;
  if (cacheReadInputTokens != null && modelCacheReadsPrice != null) {
    cacheReadsCost = (modelCacheReadsPrice / 1_000_000) * cacheReadInputTokens;
  }
  const baseInputCost = ((model.inputPrice ?? 0) / 1_000_000) * inputTokens;
  const outputCost = ((model.outputPrice ?? 0) / 1_000_000) * outputTokens;
  const totalCost = cacheWritesCost + cacheReadsCost + baseInputCost + outputCost;
  return totalCost;
}
