import { describe, expect, it, vi } from "vitest";

const { query } = vi.hoisted(() => ({
  query: vi.fn(),
}));

vi.mock("./db", () => ({
  pool: { query },
}));

import { getHealthStatus } from "./health";

describe("getHealthStatus", () => {
  it("returns 200 when database responds", async () => {
    query.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });
    const { body, httpStatus } = await getHealthStatus();
    expect(httpStatus).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.checks.database).toBe("ok");
  });

  it("returns 503 when database fails", async () => {
    query.mockRejectedValueOnce(new Error("connection refused"));
    const { body, httpStatus } = await getHealthStatus();
    expect(httpStatus).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toBe("error");
  });
});
