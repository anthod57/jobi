import type { LlmProvider } from "./types";

interface ModelPricingPerMillion {
  inputUsd: number;
  outputUsd: number;
}

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  mistral: "mistral-small-latest",
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-latest",
};

const MODEL_PRICING_PER_1M: Record<LlmProvider, Record<string, ModelPricingPerMillion>> = {
  mistral: {
    "mistral-small-latest": { inputUsd: 0.1, outputUsd: 0.3 },
    "mistral-medium-latest": { inputUsd: 0.4, outputUsd: 2.0 },
    "mistral-large-latest": { inputUsd: 2.0, outputUsd: 6.0 },
  },
  openai: {
    "gpt-4o-mini": { inputUsd: 0.15, outputUsd: 0.6 },
    "gpt-4o": { inputUsd: 2.5, outputUsd: 10.0 },
    "gpt-4.1-mini": { inputUsd: 0.4, outputUsd: 1.6 },
  },
  anthropic: {
    "claude-3-5-haiku-latest": { inputUsd: 0.8, outputUsd: 4.0 },
    "claude-3-5-sonnet-latest": { inputUsd: 3.0, outputUsd: 15.0 },
    "claude-sonnet-4-0": { inputUsd: 3.0, outputUsd: 15.0 },
  },
};

export function getDefaultModelForProvider(provider: LlmProvider): string {
  return DEFAULT_MODELS[provider];
}

export function estimateLlmCostUsd(
  provider: LlmProvider,
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing = MODEL_PRICING_PER_1M[provider]?.[model];
  if (!pricing) {
    return 0;
  }

  const safePrompt = Number.isFinite(promptTokens) && promptTokens > 0 ? promptTokens : 0;
  const safeCompletion =
    Number.isFinite(completionTokens) && completionTokens > 0 ? completionTokens : 0;

  const cost =
    (safePrompt * pricing.inputUsd + safeCompletion * pricing.outputUsd) / 1_000_000;
  return Number(cost.toFixed(6));
}
