import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetDb } = vi.hoisted(() => ({
  mockGetDb: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  getDb: mockGetDb,
}));

import {
  getScoredOfferById,
  listScoredOffers,
  recomputeScoresForAllOffers,
  recomputeScoresForOfferIds,
} from "./score-repository";

function createQueryChain<T>(result: T) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.from = vi.fn(self);
  chain.leftJoin = vi.fn(self);
  chain.where = vi.fn(self);
  chain.orderBy = vi.fn(self);
  chain.limit = vi.fn(self);
  chain.offset = vi.fn(self);
  chain.values = vi.fn(self);
  chain.onConflictDoUpdate = vi.fn(async () => result);
  chain.then = (resolve: (val: T) => void) =>
    Promise.resolve(result).then(resolve);
  return chain;
}

describe("score-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recomputeScoresForAllOffers returns 0 when no profile exists", async () => {
    const db = {
      select: vi.fn(() => createQueryChain([])),
    };
    mockGetDb.mockReturnValue(db);

    const count = await recomputeScoresForAllOffers();
    expect(count).toBe(0);
  });

  it("recomputeScoresForAllOffers scores active offers and upserts into offer_scores", async () => {
    const selectResults = [
      [
        {
          id: 1,
          headline: "Développeur TypeScript",
          locationLabel: "Lyon",
          remotePreference: "hybrid",
          minSalaryAnnualGross: 45000,
          contractTypes: ["cdi"],
        },
      ],
      [{ label: "TypeScript" }, { label: "React" }],
      [
        {
          id: 10,
          title: "Développeur TypeScript React",
          company: "Acme",
          locationLabel: "Lyon",
          contractType: "cdi",
          remoteMode: "hybrid",
          salaryMin: 48000,
          salaryMax: 52000,
          description: "TypeScript and React role",
        },
      ],
    ];
    let idx = 0;
    const insertChain = createQueryChain(undefined);
    const db = {
      select: vi.fn(() => createQueryChain(selectResults[idx++] ?? [])),
      insert: vi.fn(() => insertChain),
    };
    mockGetDb.mockReturnValue(db);

    const count = await recomputeScoresForAllOffers();

    expect(count).toBe(1);
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(insertChain.values).toHaveBeenCalledTimes(1);
    expect(insertChain.onConflictDoUpdate).toHaveBeenCalledTimes(1);
  });

  it("recomputeScoresForOfferIds returns 0 immediately when offerIds is empty", async () => {
    const count = await recomputeScoresForOfferIds([]);
    expect(count).toBe(0);
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it("recomputeScoresForOfferIds scores specified offers and upserts", async () => {
    const selectResults = [
      [
        {
          id: 1,
          headline: "Backend Engineer",
          locationLabel: "Paris",
          remotePreference: "remote",
          minSalaryAnnualGross: null,
          contractTypes: ["cdi"],
        },
      ],
      [{ label: "Node" }],
      [
        {
          id: 42,
          title: "Backend Engineer Node",
          company: "Beta",
          locationLabel: "Paris",
          contractType: "cdi",
          remoteMode: "remote",
          salaryMin: null,
          salaryMax: null,
          description: "Node.js API",
        },
      ],
    ];
    let idx = 0;
    const insertChain = createQueryChain(undefined);
    const db = {
      select: vi.fn(() => createQueryChain(selectResults[idx++] ?? [])),
      insert: vi.fn(() => insertChain),
    };
    mockGetDb.mockReturnValue(db);

    const count = await recomputeScoresForOfferIds([42]);

    expect(count).toBe(1);
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it("listScoredOffers applies filters, pagination, sorting, and attaches sources", async () => {
    const offerRow = {
      id: 10,
      title: "Développeur React",
      company: "Acme",
      locationLabel: "Lyon",
      department: "69",
      contractType: "cdi",
      remoteMode: "hybrid",
      salaryMin: 45000,
      salaryMax: 55000,
      salaryText: "45k - 55k",
      publishedAt: new Date("2026-10-01T00:00:00Z"),
      lastSeenAt: new Date("2026-10-02T00:00:00Z"),
      score: 88,
      breakdown: {
        isEmptyProfile: false,
        matchedSkills: ["React"],
        missingSkills: [],
        criteria: [],
      },
    };
    const selectResults = [
      [{ total: 1 }],
      [offerRow],
      [{ offerId: 10, source: "france_travail", url: "https://ft.fr/10" }],
    ];
    let idx = 0;
    const chains: ReturnType<typeof createQueryChain>[] = [];
    const db = {
      select: vi.fn(() => {
        const c = createQueryChain(selectResults[idx++] ?? []);
        chains.push(c);
        return c;
      }),
    };
    mockGetDb.mockReturnValue(db);

    const res = await listScoredOffers({
      q: "React",
      contractType: "cdi",
      remoteMode: "hybrid",
      source: "france_travail",
      minScore: 70,
      sort: "score",
      page: 2,
      pageSize: 10,
    });

    expect(res.total).toBe(1);
    expect(res.page).toBe(2);
    expect(res.pageSize).toBe(10);
    expect(res.items).toHaveLength(1);
    expect(res.items[0].sources).toEqual([
      { source: "france_travail", url: "https://ft.fr/10" },
    ]);
    expect(chains[1].limit).toHaveBeenCalledWith(10);
    expect(chains[1].offset).toHaveBeenCalledWith(10);
  });

  it("getScoredOfferById returns null when offer does not exist", async () => {
    const db = {
      select: vi.fn(() => createQueryChain([])),
    };
    mockGetDb.mockReturnValue(db);

    const res = await getScoredOfferById(999);
    expect(res).toBeNull();
  });

  it("getScoredOfferById returns offer detail with breakdown and sources", async () => {
    const detailRow = {
      id: 10,
      title: "Développeur React",
      company: "Acme",
      locationLabel: "Lyon",
      department: "69",
      contractType: "cdi",
      remoteMode: "hybrid",
      salaryMin: 45000,
      salaryMax: 55000,
      salaryText: "45k - 55k",
      description: "Full description",
      publishedAt: new Date("2026-10-01T00:00:00Z"),
      lastSeenAt: new Date("2026-10-02T00:00:00Z"),
      score: 88,
      breakdown: {
        isEmptyProfile: false,
        matchedSkills: ["React"],
        missingSkills: [],
        criteria: [],
      },
      computedAt: new Date("2026-10-02T01:00:00Z"),
    };
    const selectResults = [
      [detailRow],
      [{ offerId: 10, source: "adzuna", url: "https://adzuna.fr/10" }],
    ];
    let idx = 0;
    const db = {
      select: vi.fn(() => createQueryChain(selectResults[idx++] ?? [])),
    };
    mockGetDb.mockReturnValue(db);

    const res = await getScoredOfferById(10);
    expect(res).not.toBeNull();
    expect(res?.id).toBe(10);
    expect(res?.description).toBe("Full description");
    expect(res?.sources).toEqual([
      { source: "adzuna", url: "https://adzuna.fr/10" },
    ]);
  });
});
