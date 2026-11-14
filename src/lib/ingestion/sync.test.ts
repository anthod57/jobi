import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getDbMock,
  getDecryptedCredentialMock,
  buildSearchQueryMock,
  fetchFranceTravailMock,
  fetchAdzunaMock,
  upsertOfferMock,
  recomputeScoresForOfferIdsMock,
} = vi.hoisted(() => ({
  getDbMock: vi.fn(),
  getDecryptedCredentialMock: vi.fn(),
  buildSearchQueryMock: vi.fn(),
  fetchFranceTravailMock: vi.fn(),
  fetchAdzunaMock: vi.fn(),
  upsertOfferMock: vi.fn(),
  recomputeScoresForOfferIdsMock: vi.fn().mockResolvedValue(0),
}));

vi.mock("@/server/db/client", () => ({
  getDb: getDbMock,
}));

vi.mock("./credentials-repository", () => ({
  getDecryptedCredential: getDecryptedCredentialMock,
}));

vi.mock("./search-query", () => ({
  buildSearchQueryFromProfile: buildSearchQueryMock,
}));

vi.mock("./clients/france-travail", () => ({
  fetchFranceTravailOffers: fetchFranceTravailMock,
}));

vi.mock("./clients/adzuna", () => ({
  fetchAdzunaOffers: fetchAdzunaMock,
}));

vi.mock("./offer-repository", () => ({
  upsertOfferWithSource: upsertOfferMock,
}));

vi.mock("@/lib/scoring/score-repository", () => ({
  recomputeScoresForOfferIds: recomputeScoresForOfferIdsMock,
}));

import { listRecentIngestionRuns, runIngestionSync } from "./sync";

function makeLimitChain(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn().mockReturnValue({ limit });
  const where = vi.fn().mockReturnValue({ orderBy, limit });
  const from = vi.fn().mockReturnValue({ where, orderBy, limit });
  return { from, where, orderBy, limit };
}

describe("ingestion sync orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips sync when an ingestion_runs row is already running within 15 minutes", async () => {
    const select = vi.fn().mockReturnValueOnce(makeLimitChain([{ id: 7 }]));
    getDbMock.mockReturnValue({ select });

    const result = await runIngestionSync({ trigger: "manual" });

    expect(result.runs).toEqual([]);
    expect(result.skippedReason).toBeTruthy();
    expect(fetchFranceTravailMock).not.toHaveBeenCalled();
    expect(fetchAdzunaMock).not.toHaveBeenCalled();
  });

  it("uses 30-day window on first run, incremental window afterwards, and records counters", async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600_000);

    const select = vi
      .fn()
      // 1) Active running lock check -> none
      .mockReturnValueOnce(makeLimitChain([]))
      // 2) Last finished run for france_travail -> none (initial 30d)
      .mockReturnValueOnce(makeLimitChain([]))
      // 3) Last finished run for adzuna -> 2 days ago (incremental)
      .mockReturnValueOnce(makeLimitChain([{ finishedAt: twoDaysAgo }]));

    const insertedRuns = [
      {
        id: 10,
        source: "france_travail",
        status: "running",
        fetchedCount: 0,
        insertedCount: 0,
        updatedCount: 0,
        dedupedCount: 0,
        errorMessage: null,
        startedAt: new Date(),
        finishedAt: null,
      },
      {
        id: 11,
        source: "adzuna",
        status: "running",
        fetchedCount: 0,
        insertedCount: 0,
        updatedCount: 0,
        dedupedCount: 0,
        errorMessage: null,
        startedAt: new Date(),
        finishedAt: null,
      },
    ];
    let insertIdx = 0;
    const insert = vi.fn().mockImplementation(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockImplementation(() => {
          const row = insertedRuns[insertIdx++];
          return Promise.resolve([row]);
        }),
      }),
    }));

    const updatePayloads: Record<string, unknown>[] = [];
    const update = vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
        updatePayloads.push(payload);
        return {
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                ...insertedRuns[updatePayloads.length - 1],
                ...payload,
              },
            ]),
          }),
        };
      }),
    }));

    getDbMock.mockReturnValue({ select, insert, update });

    getDecryptedCredentialMock.mockImplementation(async (provider: string) => {
      if (provider === "france_travail") {
        return { clientId: "ft-id", clientSecret: "ft-sec" };
      }
      if (provider === "adzuna") {
        return { appId: "az-id", appKey: "az-key" };
      }
      return null;
    });

    buildSearchQueryMock.mockImplementation(
      async (opts?: { maxDaysOld?: number }) => ({
        keywords: "TypeScript",
        maxDaysOld: opts?.maxDaysOld,
      }),
    );

    fetchFranceTravailMock.mockResolvedValueOnce([
      { source: "france_travail", externalId: "1", title: "Dev 1" },
      { source: "france_travail", externalId: "2", title: "Dev 2" },
    ]);
    fetchAdzunaMock.mockResolvedValueOnce([
      { source: "adzuna", externalId: "A1", title: "Dev 1" },
    ]);

    upsertOfferMock
      .mockResolvedValueOnce({ offerId: 1, outcome: "inserted" })
      .mockResolvedValueOnce({ offerId: 2, outcome: "updated" })
      .mockResolvedValueOnce({ offerId: 1, outcome: "deduped" });

    const result = await runIngestionSync({ trigger: "cron" });

    expect(buildSearchQueryMock).toHaveBeenNthCalledWith(1, { maxDaysOld: 30 });
    expect(buildSearchQueryMock).toHaveBeenNthCalledWith(2, { maxDaysOld: 2 });

    expect(result.runs).toHaveLength(2);
    expect(updatePayloads[0]).toMatchObject({
      status: "success",
      fetchedCount: 2,
      insertedCount: 1,
      updatedCount: 1,
      dedupedCount: 0,
      errorMessage: null,
    });
    expect(updatePayloads[1]).toMatchObject({
      status: "success",
      fetchedCount: 1,
      insertedCount: 0,
      updatedCount: 0,
      dedupedCount: 1,
      errorMessage: null,
    });
  });

  it("lists recent ingestion runs ordered by startedAt desc", async () => {
    const rows = [
      {
        id: 2,
        source: "adzuna",
        status: "success",
        fetchedCount: 5,
        insertedCount: 5,
        updatedCount: 0,
        dedupedCount: 0,
        errorMessage: null,
        startedAt: new Date("2026-11-12T10:00:00Z"),
        finishedAt: new Date("2026-11-12T10:01:00Z"),
      },
    ];
    const chain = makeLimitChain(rows);
    getDbMock.mockReturnValue({ select: vi.fn().mockReturnValue(chain) });

    const result = await listRecentIngestionRuns(10);

    expect(chain.limit).toHaveBeenCalledWith(10);
    expect(result).toEqual(rows);
  });
});
