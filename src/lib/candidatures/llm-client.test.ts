import { afterEach, describe, expect, it, vi } from "vitest";

import { generateWithLlm } from "./llm-client";

const SAMPLE_PROMPT = {
  system: "Tu es un assistant.",
  user: "Rédige une candidature.",
};

describe("generateWithLlm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls Mistral API with Bearer auth and parses JSON response + token usage", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  subject: "Candidature Développeur TS",
                  body: "Bonjour, je postule avec enthousiasme.",
                }),
              },
            },
          ],
          usage: {
            prompt_tokens: 120,
            completion_tokens: 80,
            total_tokens: 200,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateWithLlm(
      "mistral",
      "mistral-secret-key",
      "mistral-small-latest",
      SAMPLE_PROMPT,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.mistral.ai/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer mistral-secret-key",
    );
    expect(result.subject).toBe("Candidature Développeur TS");
    expect(result.body).toBe("Bonjour, je postule avec enthousiasme.");
    expect(result.promptTokens).toBe(120);
    expect(result.completionTokens).toBe(80);
    expect(result.totalTokens).toBe(200);
    expect(result.estimatedCostUsd).toBeGreaterThan(0);
  });

  it("calls OpenAI API and extracts JSON wrapped in markdown code fences", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content:
                  '```json\n{"subject":"Candidature OpenAI","body":"Corps du message"}\n```',
              },
            },
          ],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150,
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateWithLlm(
      "openai",
      "openai-secret-key",
      "gpt-4o-mini",
      SAMPLE_PROMPT,
    );

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(result.subject).toBe("Candidature OpenAI");
    expect(result.body).toBe("Corps du message");
    expect(result.totalTokens).toBe(150);
  });

  it("calls Anthropic API with x-api-key and anthropic-version headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                subject: "Candidature Anthropic",
                body: "Lettre générée par Claude.",
              }),
            },
          ],
          usage: {
            input_tokens: 200,
            output_tokens: 100,
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateWithLlm(
      "anthropic",
      "anthropic-secret-key",
      "claude-3-5-haiku-latest",
      SAMPLE_PROMPT,
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(headers["x-api-key"]).toBe("anthropic-secret-key");
    expect(headers["anthropic-version"]).toBe("2023-06-01");
    expect(result.subject).toBe("Candidature Anthropic");
    expect(result.body).toBe("Lettre générée par Claude.");
    expect(result.promptTokens).toBe(200);
    expect(result.completionTokens).toBe(100);
    expect(result.totalTokens).toBe(300);
  });

  it("falls back to raw text body when LLM returns plain non-JSON text", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Bonjour, voici ma candidature spontanée." } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateWithLlm(
      "openai",
      "sk-test-1234",
      "gpt-4o-mini",
      SAMPLE_PROMPT,
    );

    expect(result.subject).toBeTruthy();
    expect(result.body).toBe("Bonjour, voici ma candidature spontanée.");
  });

  it("throws descriptive error on HTTP error without exposing API key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Invalid key" } }), {
        status: 401,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      generateWithLlm("openai", "sk-super-secret-value", "gpt-4o-mini", SAMPLE_PROMPT),
    ).rejects.toThrow(/401/);

    try {
      await generateWithLlm(
        "openai",
        "sk-super-secret-value",
        "gpt-4o-mini",
        SAMPLE_PROMPT,
      );
    } catch (error) {
      expect((error as Error).message).not.toContain("sk-super-secret-value");
    }
  });

  it("omits temperature for OpenAI reasoning/gpt-5 models and surfaces HTTP 400 error details", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    subject: "Candidature",
                    body: "Corps",
                  }),
                },
              },
            ],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { message: "The model `bad-model` does not exist" },
          }),
          { status: 400 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await generateWithLlm("openai", "sk-test", "gpt-5-mini", SAMPLE_PROMPT);
    const bodySent = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string,
    ) as Record<string, unknown>;
    expect(bodySent.temperature).toBeUndefined();

    await expect(
      generateWithLlm("openai", "sk-test", "bad-model", SAMPLE_PROMPT),
    ).rejects.toThrow(/HTTP 400 — The model `bad-model` does not exist/);
  });

  it("retries without temperature when OpenAI returns HTTP 400 rejecting temperature", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              message:
                "Unsupported value: 'temperature' does not support 0.7 with this model.",
            },
          }),
          { status: 400 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    subject: "Candidature OK",
                    body: "Corps après retry",
                  }),
                },
              },
            ],
            usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 },
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateWithLlm(
      "openai",
      "sk-test",
      "custom-reasoning-model",
      SAMPLE_PROMPT,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retryBody = JSON.parse(
      (fetchMock.mock.calls[1]?.[1] as RequestInit).body as string,
    ) as Record<string, unknown>;
    expect(retryBody.temperature).toBeUndefined();
    expect(result.subject).toBe("Candidature OK");
  });
});
