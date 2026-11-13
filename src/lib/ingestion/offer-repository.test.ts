import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDbMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  getDb: getDbMock,
}));

import { computeDedupKey } from "./dedup";
import {
  upsertOfferWithSource,
  type NormalizedOfferInput,
} from "./offer-repository";

function makeOfferInput(
  overrides: Partial<NormalizedOfferInput> = {},
): NormalizedOfferInput {
  return {
    source: "france_travail",
    externalId: "FT-123",
    url: "https://example.com/offers/FT-123",
    title: "Développeur Full-Stack",
    company: "Jobi SAS",
    locationLabel: "Paris (75)",
    department: "75",
    contractType: "cdi",
    remoteMode: "hybrid",
    salaryMin: 45000,
    salaryMax: 55000,
    salaryText: "45k - 55k",
    description: "Description complète du poste",
    publishedAt: new Date("2026-11-10T09:00:00Z"),
    rawPayload: { id: "FT-123" },
    ...overrides,
  };
}

function makeSelectChain(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  return { from, where, limit };
}

describe("offer-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns outcome 'updated' when (source, externalId) already exists and backfills missing offer fields", async () => {
    const select = vi
      .fn()
      .mockReturnValueOnce(makeSelectChain([{ id: 10, offerId: 42 }]))
      .mockReturnValueOnce(
        makeSelectChain([
          {
            id: 42,
            department: null,
            contractType: null,
            remoteMode: "remote",
            salaryMin: null,
            salaryMax: null,
            salaryText: null,
            description: "",
            publishedAt: null,
          },
        ]),
      );

    const updateWhereCalls: unknown[] = [];
    const updateSetCalls: Record<string, unknown>[] = [];
    const update = vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
        updateSetCalls.push(payload);
        return {
          where: vi.fn().mockImplementation((cond: unknown) => {
            updateWhereCalls.push(cond);
            return Promise.resolve(undefined);
          }),
        };
      }),
    }));

    const insert = vi.fn();
    const tx = { select, update, insert };
    getDbMock.mockReturnValue({
      transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    });

    const input = makeOfferInput({ remoteMode: "hybrid" });
    const result = await upsertOfferWithSource(input);

    expect(result).toEqual({ offerId: 42, outcome: "updated" });
    expect(insert).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(2);
    expect(updateSetCalls[0]).toMatchObject({
      url: input.url,
      rawPayload: input.rawPayload,
    });
    expect(updateSetCalls[0].fetchedAt).toBeInstanceOf(Date);

    // Backfills missing fields without overwriting existing remoteMode ("remote")
    expect(updateSetCalls[1]).toMatchObject({
      department: "75",
      contractType: "cdi",
      salaryMin: 45000,
      salaryMax: 55000,
      salaryText: "45k - 55k",
      description: input.description,
      publishedAt: input.publishedAt,
    });
    expect(updateSetCalls[1].remoteMode).toBeUndefined();
    expect(updateSetCalls[1].lastSeenAt).toBeInstanceOf(Date);
  });

  it("returns outcome 'deduped' when dedupKey matches an existing offer from another source", async () => {
    const select = vi
      .fn()
      .mockReturnValueOnce(makeSelectChain([]))
      .mockReturnValueOnce(makeSelectChain([{ id: 77 }]));

    const insertValuesCalls: Record<string, unknown>[] = [];
    const insert = vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
        insertValuesCalls.push(payload);
        return Promise.resolve(undefined);
      }),
    }));

    const updateSetCalls: Record<string, unknown>[] = [];
    const update = vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
        updateSetCalls.push(payload);
        return {
          where: vi.fn().mockResolvedValue(undefined),
        };
      }),
    }));

    const tx = { select, update, insert };
    getDbMock.mockReturnValue({
      transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    });

    const input = makeOfferInput({
      source: "adzuna",
      externalId: "ADZ-999",
      url: "https://adzuna.fr/jobs/999",
    });

    const result = await upsertOfferWithSource(input);

    expect(result).toEqual({ offerId: 77, outcome: "deduped" });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insertValuesCalls[0]).toMatchObject({
      offerId: 77,
      source: "adzuna",
      externalId: "ADZ-999",
      url: "https://adzuna.fr/jobs/999",
      rawPayload: input.rawPayload,
    });
    expect(update).toHaveBeenCalledTimes(1);
    expect(updateSetCalls[0].lastSeenAt).toBeInstanceOf(Date);
  });

  it("returns outcome 'inserted' when neither source+externalId nor dedupKey exists", async () => {
    const select = vi
      .fn()
      .mockReturnValueOnce(makeSelectChain([]))
      .mockReturnValueOnce(makeSelectChain([]));

    const insertedPayloads: Record<string, unknown>[] = [];
    const insert = vi
      .fn()
      .mockImplementationOnce(() => ({
        values: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
          insertedPayloads.push(payload);
          return {
            returning: vi.fn().mockResolvedValue([{ id: 101 }]),
          };
        }),
      }))
      .mockImplementationOnce(() => ({
        values: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
          insertedPayloads.push(payload);
          return Promise.resolve(undefined);
        }),
      }));

    const update = vi.fn();
    const tx = { select, update, insert };
    getDbMock.mockReturnValue({
      transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    });

    const input = makeOfferInput();
    const result = await upsertOfferWithSource(input);

    expect(result).toEqual({ offerId: 101, outcome: "inserted" });
    expect(update).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledTimes(2);
    expect(insertedPayloads[0]).toMatchObject({
      dedupKey: computeDedupKey({
        title: input.title,
        company: input.company,
        locationLabel: input.locationLabel,
      }),
      title: input.title,
      company: input.company,
      locationLabel: input.locationLabel,
    });
    expect(insertedPayloads[1]).toMatchObject({
      offerId: 101,
      source: input.source,
      externalId: input.externalId,
      url: input.url,
    });
  });
});
