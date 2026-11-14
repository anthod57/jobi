import { estimateLlmCostUsd, getDefaultModelForProvider } from "./pricing";
import type { ApplicationPrompt } from "./prompt";
import type { LlmGenerationResult, LlmProvider } from "./types";

const REQUEST_TIMEOUT_MS = 30_000;

interface ParsedDraft {
  subject: string;
  body: string;
}

interface RawLlmResponse {
  text: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

function parseDraftJson(rawText: string): ParsedDraft {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error("LLM returned an empty response.");
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;
  const jsonStart = candidate.indexOf("{");
  const jsonEnd = candidate.lastIndexOf("}");

  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    try {
      const parsed = JSON.parse(candidate.slice(jsonStart, jsonEnd + 1)) as {
        subject?: unknown;
        body?: unknown;
      };
      const subject =
        typeof parsed.subject === "string" && parsed.subject.trim()
          ? parsed.subject.trim().slice(0, 300)
          : "Candidature";
      const body = typeof parsed.body === "string" ? parsed.body.trim() : "";
      if (body) {
        return { subject, body };
      }
    } catch {
      // Fall through to plain-text fallback when model output is not valid JSON.
    }
  }

  return {
    subject: "Candidature",
    body: trimmed,
  };
}

async function readApiErrorDetail(response: Response): Promise<string> {
  try {
    const raw = await response.text();
    if (!raw.trim()) return "";
    const parsed = JSON.parse(raw) as {
      error?: { message?: unknown };
      message?: unknown;
    };
    const msg =
      typeof parsed?.error?.message === "string"
        ? parsed.error.message
        : typeof parsed?.message === "string"
          ? parsed.message
          : raw;
    return msg.trim().slice(0, 200);
  } catch {
    return "";
  }
}

function supportsTemperature(model: string): boolean {
  return !/^(o\d|gpt-5)/i.test(model.trim());
}

async function postOpenAiCompatible(
  url: string,
  apiKey: string,
  model: string,
  prompt: ApplicationPrompt,
  includeTemperature: boolean,
): Promise<Response> {
  const payload: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
  };
  if (includeTemperature) {
    payload.temperature = 0.7;
  }

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

async function callOpenAiCompatible(
  url: string,
  apiKey: string,
  model: string,
  prompt: ApplicationPrompt,
  providerLabel: string,
): Promise<RawLlmResponse> {
  const includeTemp = supportsTemperature(model);
  let response = await postOpenAiCompatible(
    url,
    apiKey,
    model,
    prompt,
    includeTemp,
  );

  if (!response.ok) {
    const detail = await readApiErrorDetail(response);
    if (
      includeTemp &&
      response.status === 400 &&
      /temperature/i.test(detail)
    ) {
      response = await postOpenAiCompatible(url, apiKey, model, prompt, false);
      if (!response.ok) {
        const retryDetail = await readApiErrorDetail(response);
        throw new Error(
          `${providerLabel} API error: HTTP ${response.status}${retryDetail ? ` — ${retryDetail}` : ""}`,
        );
      }
    } else {
      throw new Error(
        `${providerLabel} API error: HTTP ${response.status}${detail ? ` — ${detail}` : ""}`,
      );
    }
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };

  const text = data.choices?.[0]?.message?.content ?? "";
  const promptTokens = data.usage?.prompt_tokens ?? 0;
  const completionTokens = data.usage?.completion_tokens ?? 0;
  const totalTokens = data.usage?.total_tokens ?? promptTokens + completionTokens;

  return { text, promptTokens, completionTokens, totalTokens };
}

async function callAnthropic(
  apiKey: string,
  model: string,
  prompt: ApplicationPrompt,
): Promise<RawLlmResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await readApiErrorDetail(response);
    throw new Error(
      `Anthropic API error: HTTP ${response.status}${detail ? ` — ${detail}` : ""}`,
    );
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
    };
  };

  const text =
    data.content?.find((block) => block.type === "text")?.text ??
    data.content?.[0]?.text ??
    "";
  const promptTokens = data.usage?.input_tokens ?? 0;
  const completionTokens = data.usage?.output_tokens ?? 0;
  const totalTokens = promptTokens + completionTokens;

  return { text, promptTokens, completionTokens, totalTokens };
}

export async function callLlmRaw(
  provider: LlmProvider,
  apiKey: string,
  model: string,
  prompt: ApplicationPrompt,
): Promise<RawLlmResponse & { resolvedModel: string }> {
  if (!apiKey.trim()) {
    throw new Error(`Missing API key for provider ${provider}.`);
  }

  const resolvedModel = model.trim() || getDefaultModelForProvider(provider);

  let raw: RawLlmResponse;
  if (provider === "mistral") {
    raw = await callOpenAiCompatible(
      "https://api.mistral.ai/v1/chat/completions",
      apiKey,
      resolvedModel,
      prompt,
      "Mistral",
    );
  } else if (provider === "openai") {
    raw = await callOpenAiCompatible(
      "https://api.openai.com/v1/chat/completions",
      apiKey,
      resolvedModel,
      prompt,
      "OpenAI",
    );
  } else {
    raw = await callAnthropic(apiKey, resolvedModel, prompt);
  }

  return { ...raw, resolvedModel };
}

export async function generateWithLlm(
  provider: LlmProvider,
  apiKey: string,
  model: string,
  prompt: ApplicationPrompt,
): Promise<LlmGenerationResult> {
  const { resolvedModel, ...raw } = await callLlmRaw(
    provider,
    apiKey,
    model,
    prompt,
  );

  const parsed = parseDraftJson(raw.text);
  const estimatedCostUsd = estimateLlmCostUsd(
    provider,
    resolvedModel,
    raw.promptTokens,
    raw.completionTokens,
  );

  return {
    subject: parsed.subject,
    body: parsed.body,
    promptTokens: raw.promptTokens,
    completionTokens: raw.completionTokens,
    totalTokens: raw.totalTokens,
    estimatedCostUsd,
  };
}
