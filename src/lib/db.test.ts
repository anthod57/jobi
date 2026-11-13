import { describe, expect, it, vi } from "vitest";

import { createPool, pool, resetPoolForTests } from "./db";

describe("db pool", () => {
  it("imports without DATABASE_URL at module load", () => {
    expect(pool).toBeTruthy();
    expect(createPool).toBeTypeOf("function");
  });

  it("throws when DATABASE_URL is missing on first query", async () => {
    vi.stubEnv("DATABASE_URL", "");
    await resetPoolForTests();
    expect(() => pool.query("SELECT 1")).toThrow("DATABASE_URL is not set");
    vi.unstubAllEnvs();
    await resetPoolForTests();
  });

  it("createPool uses the connection string", () => {
    const p = createPool("postgresql://user:pass@localhost:5432/jobi");
    expect(p).toBeTruthy();
    void p.end();
  });
});
