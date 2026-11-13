import { afterEach, describe, expect, it, vi } from "vitest";

import { getDb, resetDbForTests } from "./client";

describe("getDb", () => {
  afterEach(async () => {
    await resetDbForTests();
    vi.unstubAllEnvs();
  });

  it("throws when DATABASE_URL is missing", () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(() => getDb()).toThrow("DATABASE_URL must be set");
  });

  it("returns the same singleton until reset", async () => {
    const url =
      process.env.DATABASE_URL ??
      "postgresql://jobi:jobi@localhost:5432/jobi";
    vi.stubEnv("DATABASE_URL", url);
    if (process.env.WF_TEST_DB_AVAILABLE !== "1") {
      return;
    }
    const first = getDb();
    const second = getDb();
    expect(first).toBe(second);
    await resetDbForTests();
    const third = getDb();
    expect(third).not.toBe(first);
  });
});
