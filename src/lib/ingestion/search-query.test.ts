import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDbMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  getDb: getDbMock,
}));

import { buildSearchQueryFromProfile } from "./search-query";

function makeProfileQueryMock(profileRows: unknown[], skillRows: unknown[]) {
  const profileLimit = vi.fn().mockResolvedValue(profileRows);
  const profileOrderBy = vi.fn().mockReturnValue({ limit: profileLimit });
  const profileFrom = vi.fn().mockReturnValue({ orderBy: profileOrderBy });

  const skillLimit = vi.fn().mockResolvedValue(skillRows);
  const skillOrderBy = vi.fn().mockReturnValue({ limit: skillLimit });
  const skillWhere = vi.fn().mockReturnValue({ orderBy: skillOrderBy });
  const skillFrom = vi.fn().mockReturnValue({ where: skillWhere });

  const select = vi
    .fn()
    .mockReturnValueOnce({ from: profileFrom })
    .mockReturnValueOnce({ from: skillFrom });

  getDbMock.mockReturnValue({ select });
}

describe("buildSearchQueryFromProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts broad keywords from profile headline without geo or contract filters", async () => {
    makeProfileQueryMock(
      [{ id: 1, headline: "  Développeur Full-Stack React  " }],
      [{ label: "TypeScript" }, { label: "PostgreSQL" }],
    );

    const query = await buildSearchQueryFromProfile({ maxDaysOld: 14 });

    expect(query).toEqual({
      keywords: "Développeur Full-Stack React",
      maxDaysOld: 14,
    });
  });

  it("falls back to top profile skills when headline is empty", async () => {
    makeProfileQueryMock(
      [{ id: 1, headline: "   " }],
      [{ label: "TypeScript" }, { label: "Node.js" }, { label: "Docker" }],
    );

    const query = await buildSearchQueryFromProfile();

    expect(query).toEqual({
      keywords: "TypeScript Node.js Docker",
      maxDaysOld: undefined,
    });
  });

  it("returns empty keywords when no profile exists", async () => {
    const profileLimit = vi.fn().mockResolvedValue([]);
    const profileOrderBy = vi.fn().mockReturnValue({ limit: profileLimit });
    const profileFrom = vi.fn().mockReturnValue({ orderBy: profileOrderBy });
    getDbMock.mockReturnValue({
      select: vi.fn().mockReturnValue({ from: profileFrom }),
    });

    const query = await buildSearchQueryFromProfile({ maxDaysOld: 30 });

    expect(query).toEqual({
      keywords: "",
      maxDaysOld: 30,
    });
  });
});
