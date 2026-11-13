import { describe, expect, it, vi } from "vitest";

describe("db pool guard", () => {
  it("throws when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.resetModules();
    await expect(import("./db")).rejects.toThrow("DATABASE_URL is not set");
    vi.unstubAllEnvs();
  });
});
