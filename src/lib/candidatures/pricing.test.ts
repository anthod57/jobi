import { describe, expect, it } from "vitest";

import {
  estimateLlmCostUsd,
  getDefaultModelForProvider,
} from "./pricing";

describe("getDefaultModelForProvider", () => {
  it("returns expected default models for each provider", () => {
    expect(getDefaultModelForProvider("mistral")).toBe("mistral-small-latest");
    expect(getDefaultModelForProvider("openai")).toBe("gpt-4o-mini");
    expect(getDefaultModelForProvider("anthropic")).toBe("claude-3-5-haiku-latest");
  });
});

describe("estimateLlmCostUsd", () => {
  it("computes positive USD cost for known Mistral, OpenAI, and Anthropic models", () => {
    const mistralCost = estimateLlmCostUsd("mistral", "mistral-small-latest", 1000, 500);
    const openaiCost = estimateLlmCostUsd("openai", "gpt-4o-mini", 1000, 500);
    const anthropicCost = estimateLlmCostUsd("anthropic", "claude-3-5-haiku-latest", 1000, 500);

    expect(mistralCost).toBeGreaterThan(0);
    expect(openaiCost).toBeGreaterThan(0);
    expect(anthropicCost).toBeGreaterThan(0);
    expect(Number.isFinite(mistralCost)).toBe(true);
    expect(Number.isFinite(openaiCost)).toBe(true);
    expect(Number.isFinite(anthropicCost)).toBe(true);
  });

  it("scales linearly with token counts and returns 0 for zero tokens", () => {
    const base = estimateLlmCostUsd("openai", "gpt-4o-mini", 1000, 1000);
    const doubled = estimateLlmCostUsd("openai", "gpt-4o-mini", 2000, 2000);

    expect(doubled).toBeCloseTo(base * 2, 10);
    expect(estimateLlmCostUsd("openai", "gpt-4o-mini", 0, 0)).toBe(0);
  });

  it("returns 0 for unknown models or mismatched provider/model", () => {
    expect(estimateLlmCostUsd("openai", "unknown-model-xyz", 1000, 500)).toBe(0);
    expect(estimateLlmCostUsd("mistral", "gpt-4o-mini", 1000, 500)).toBe(0);
  });
});
