import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetDecryptedCredential,
  mockGetScoredOfferById,
  mockGetProfile,
  mockGenerateWithLlm,
  mockSaveGeneratedApplication,
  mockUpdateApplication,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockGetDecryptedCredential: vi.fn(),
  mockGetScoredOfferById: vi.fn(),
  mockGetProfile: vi.fn(),
  mockGenerateWithLlm: vi.fn(),
  mockSaveGeneratedApplication: vi.fn(),
  mockUpdateApplication: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/ingestion/credentials-repository", () => ({
  getDecryptedCredential: mockGetDecryptedCredential,
}));

vi.mock("@/lib/scoring/score-repository", () => ({
  getScoredOfferById: mockGetScoredOfferById,
}));

vi.mock("@/lib/profile/repository", () => ({
  getProfile: mockGetProfile,
}));

vi.mock("@/lib/candidatures/llm-client", () => ({
  generateWithLlm: mockGenerateWithLlm,
}));

vi.mock("@/lib/candidatures/repository", () => ({
  saveGeneratedApplication: mockSaveGeneratedApplication,
  updateApplication: mockUpdateApplication,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { generateDraftAction, updateApplicationAction } from "./actions";

describe("generateDraftAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation error for invalid offerId", async () => {
    const res = await generateDraftAction({
      offerId: 0,
      tone: "professional",
      customInstructions: "",
    });
    expect(res.ok).toBe(false);
    expect(mockGenerateWithLlm).not.toHaveBeenCalled();
  });

  it("returns missing config error when no LLM API key is configured", async () => {
    mockGetDecryptedCredential
      .mockResolvedValueOnce({ activeProvider: "mistral", model: "mistral-small-latest" })
      .mockResolvedValueOnce(null);

    const res = await generateDraftAction({
      offerId: 42,
      tone: "professional",
      customInstructions: "",
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain("Paramètres");
    }
    expect(mockGenerateWithLlm).not.toHaveBeenCalled();
  });

  it("returns error when offer is not found", async () => {
    mockGetDecryptedCredential
      .mockResolvedValueOnce({ activeProvider: "openai", model: "gpt-4o-mini" })
      .mockResolvedValueOnce({ apiKey: "sk-openai-123" });
    mockGetScoredOfferById.mockResolvedValueOnce(null);
    mockGetProfile.mockResolvedValueOnce({
      headline: "Dev",
      skills: [],
      experiences: [],
      cv: null,
    });

    const res = await generateDraftAction({
      offerId: 999,
      tone: "direct",
      customInstructions: "",
    });

    expect(res.ok).toBe(false);
    expect(mockGenerateWithLlm).not.toHaveBeenCalled();
  });

  it("calls LLM with prompt, saves application, and revalidates paths", async () => {
    mockGetDecryptedCredential
      .mockResolvedValueOnce({ activeProvider: "anthropic", model: "claude-3-5-sonnet-latest" })
      .mockResolvedValueOnce({ apiKey: "sk-ant-123" });
    mockGetScoredOfferById.mockResolvedValueOnce({
      id: 42,
      title: "Développeur TypeScript",
      company: "Acme",
      locationLabel: "Paris",
      contractType: "cdi",
      remoteMode: "hybrid",
      description: "Stack Next.js et PostgreSQL",
    });
    mockGetProfile.mockResolvedValueOnce({
      headline: "Développeur Full-Stack",
      skills: [{ id: 1, label: "TypeScript", sortOrder: 0 }],
      experiences: [
        {
          id: 1,
          title: "Lead Dev",
          company: "Beta",
          location: "Lyon",
          startDate: "2022-01",
          endDate: null,
          description: "Architecture web",
          sortOrder: 0,
        },
      ],
      cv: { extractedText: "CV texte", originalFilename: "cv.pdf" },
    });
    mockGenerateWithLlm.mockResolvedValueOnce({
      subject: "Candidature Développeur TypeScript",
      body: "Bonjour, ...",
      promptTokens: 200,
      completionTokens: 100,
      totalTokens: 300,
      estimatedCostUsd: 0.0021,
    });
    mockSaveGeneratedApplication.mockResolvedValueOnce({ id: 7 });

    const res = await generateDraftAction({
      offerId: 42,
      tone: "enthusiastic",
      customInstructions: "Mentionner Next.js",
    });

    expect(res).toEqual({ ok: true, data: { applicationId: 7 } });
    expect(mockGenerateWithLlm).toHaveBeenCalledWith(
      "anthropic",
      "sk-ant-123",
      "claude-3-5-sonnet-latest",
      expect.objectContaining({
        system: expect.any(String),
        user: expect.stringContaining("Développeur TypeScript"),
      }),
    );
    expect(mockSaveGeneratedApplication).toHaveBeenCalledWith({
      offerId: 42,
      tone: "enthusiastic",
      customInstructions: "Mentionner Next.js",
      provider: "anthropic",
      model: "claude-3-5-sonnet-latest",
      result: expect.objectContaining({
        subject: "Candidature Développeur TypeScript",
      }),
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/offres/42");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/candidatures");
  });
});

describe("updateApplicationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid payload via Zod", async () => {
    const res = await updateApplicationAction({
      applicationId: -5,
      status: "sent",
    });
    expect(res.ok).toBe(false);
    expect(mockUpdateApplication).not.toHaveBeenCalled();
  });

  it("returns error when application does not exist", async () => {
    mockUpdateApplication.mockResolvedValueOnce(null);

    const res = await updateApplicationAction({
      applicationId: 99,
      status: "validated",
    });
    expect(res.ok).toBe(false);
  });

  it("updates status, draft fields, notes, and revalidates paths", async () => {
    mockUpdateApplication.mockResolvedValueOnce({
      id: 7,
      offerId: 42,
      status: "sent",
    });

    const res = await updateApplicationAction({
      applicationId: 7,
      status: "sent",
      draftSubject: "Objet mis à jour",
      draftBody: "Corps mis à jour",
      notes: "Relance J+7",
    });

    expect(res).toEqual({ ok: true, data: undefined });
    expect(mockUpdateApplication).toHaveBeenCalledWith({
      applicationId: 7,
      status: "sent",
      draftSubject: "Objet mis à jour",
      draftBody: "Corps mis à jour",
      notes: "Relance J+7",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/candidatures");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/offres/42");
  });
});
