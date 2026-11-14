import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetDb } = vi.hoisted(() => ({
  mockGetDb: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  getDb: mockGetDb,
}));

import {
  getApplicationByOfferId,
  getCandidatureStats,
  listApplications,
  saveGeneratedApplication,
  updateApplication,
} from "./repository";

function createQueryChain<T>(result: T) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.from = vi.fn(self);
  chain.innerJoin = vi.fn(self);
  chain.where = vi.fn(self);
  chain.orderBy = vi.fn(self);
  chain.groupBy = vi.fn(self);
  chain.limit = vi.fn(self);
  chain.values = vi.fn(self);
  chain.set = vi.fn(self);
  chain.onConflictDoUpdate = vi.fn(self);
  chain.returning = vi.fn(async () => result);
  chain.then = (resolve: (val: T) => void) =>
    Promise.resolve(result).then(resolve);
  return chain;
}

describe("candidatures repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saveGeneratedApplication upserts application and inserts llm_usage_logs entry", async () => {
    const insertChains = [
      createQueryChain([{ id: 42 }]),
      createQueryChain([{ id: 100 }]),
    ];
    let insertIdx = 0;

    const db = {
      insert: vi.fn(() => insertChains[insertIdx++]),
    };
    mockGetDb.mockReturnValue(db);

    const saved = await saveGeneratedApplication({
      offerId: 7,
      tone: "professional",
      customInstructions: "Insister sur TypeScript",
      provider: "openai",
      model: "gpt-4o-mini",
      result: {
        subject: "Candidature Dev TS",
        body: "Bonjour...",
        promptTokens: 300,
        completionTokens: 150,
        totalTokens: 450,
        estimatedCostUsd: 0.000135,
      },
    });

    expect(saved.id).toBe(42);
    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(insertChains[0].onConflictDoUpdate).toHaveBeenCalledTimes(1);
    expect(insertChains[1].values).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: 42,
        provider: "openai",
        model: "gpt-4o-mini",
        promptTokens: 300,
        completionTokens: 150,
        totalTokens: 450,
        estimatedCostUsd: "0.000135",
      }),
    );
  });

  it("updateApplication updates fields and sets sentAt when status becomes sent", async () => {
    const updatedRow = {
      id: 42,
      offerId: 7,
      status: "sent",
      draftSubject: "Sujet modifié",
      draftBody: "Corps modifié",
      notes: "Envoyée par email",
      sentAt: new Date(),
    };
    const updateChain = createQueryChain([updatedRow]);
    const db = {
      update: vi.fn(() => updateChain),
    };
    mockGetDb.mockReturnValue(db);

    const result = await updateApplication({
      applicationId: 42,
      status: "sent",
      draftSubject: "Sujet modifié",
      notes: "Envoyée par email",
    });

    expect(result).toEqual(updatedRow);
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "sent",
        draftSubject: "Sujet modifié",
        notes: "Envoyée par email",
        sentAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
  });

  it("getApplicationByOfferId returns null when absent and row when present", async () => {
    const emptyChain = createQueryChain([]);
    mockGetDb.mockReturnValue({ select: vi.fn(() => emptyChain) });
    expect(await getApplicationByOfferId(999)).toBeNull();

    const row = {
      id: 1,
      offerId: 7,
      status: "draft",
      tone: "professional",
      customInstructions: "",
      draftSubject: "Objet",
      draftBody: "Corps",
      notes: "",
      provider: "mistral",
      model: "mistral-small-latest",
      sentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      offerTitle: "Dev TS",
      offerCompany: "Acme",
      offerLocationLabel: "Paris",
      offerContractType: "cdi",
      offerRemoteMode: "hybrid",
    };
    const foundChain = createQueryChain([row]);
    mockGetDb.mockReturnValue({ select: vi.fn(() => foundChain) });
    expect(await getApplicationByOfferId(7)).toEqual(row);
  });

  it("listApplications returns joined application rows", async () => {
    const rows = [
      {
        id: 1,
        offerId: 7,
        status: "validated",
        tone: "direct",
        customInstructions: "",
        draftSubject: "Objet",
        draftBody: "Corps",
        notes: "",
        provider: "anthropic",
        model: "claude-3-5-haiku-latest",
        sentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        offerTitle: "Dev TS",
        offerCompany: "Acme",
        offerLocationLabel: "Paris",
        offerContractType: "cdi",
        offerRemoteMode: "hybrid",
      },
    ];
    const chain = createQueryChain(rows);
    mockGetDb.mockReturnValue({ select: vi.fn(() => chain) });

    const result = await listApplications({ status: "validated", q: "Acme" });
    expect(result).toEqual(rows);
    expect(chain.where).toHaveBeenCalled();
  });

  it("getCandidatureStats aggregates status counts and cumulative llm_usage_logs tokens & cost", async () => {
    const appRows = [
      { status: "draft", count: 2 },
      { status: "sent", count: 3 },
    ];
    const usageRows = [
      {
        provider: "mistral",
        calls: 4,
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
        costUsd: "0.000250",
      },
      {
        provider: "openai",
        calls: 2,
        promptTokens: 600,
        completionTokens: 300,
        totalTokens: 900,
        costUsd: "0.000270",
      },
    ];

    let selectIdx = 0;
    const chains = [createQueryChain(appRows), createQueryChain(usageRows)];
    mockGetDb.mockReturnValue({
      select: vi.fn(() => chains[selectIdx++]),
    });

    const stats = await getCandidatureStats();
    expect(stats.totalApplications).toBe(5);
    expect(stats.byStatus).toEqual({
      draft: 2,
      validated: 0,
      sent: 3,
      archived: 0,
    });
    expect(stats.totalPromptTokens).toBe(1600);
    expect(stats.totalCompletionTokens).toBe(800);
    expect(stats.totalTokens).toBe(2400);
    expect(stats.totalCostUsd).toBeCloseTo(0.00052, 6);
    expect(stats.usageByProvider).toEqual([
      { provider: "mistral", calls: 4, totalTokens: 1500, costUsd: 0.00025 },
      { provider: "openai", calls: 2, totalTokens: 900, costUsd: 0.00027 },
    ]);
  });
});
