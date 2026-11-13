import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  getDecryptedCredentialMock,
  runIngestionSyncMock,
  listRecentIngestionRunsMock,
} = vi.hoisted(() => ({
  getDecryptedCredentialMock: vi.fn(),
  runIngestionSyncMock: vi.fn(),
  listRecentIngestionRunsMock: vi.fn(),
}));

vi.mock("@/lib/ingestion/credentials-repository", () => ({
  getDecryptedCredential: getDecryptedCredentialMock,
}));

vi.mock("@/lib/ingestion/sync", () => ({
  runIngestionSync: runIngestionSyncMock,
  listRecentIngestionRuns: listRecentIngestionRunsMock,
}));

import { POST } from "./route";

function makeRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader !== undefined) {
    headers.set("Authorization", authHeader);
  }
  return new Request("http://localhost:3000/api/ingestion/cron", {
    method: "POST",
    headers,
  });
}

describe("POST /api/ingestion/cron", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "super-secret-cron-token";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalSecret;
    }
  });

  it("returns 401 when Authorization header is missing or invalid", async () => {
    const resMissing = await POST(makeRequest());
    expect(resMissing.status).toBe(401);

    const resWrong = await POST(makeRequest("Bearer wrong-token"));
    expect(resWrong.status).toBe(401);

    const resShort = await POST(makeRequest("Bearer abc"));
    expect(resShort.status).toBe(401);

    expect(runIngestionSyncMock).not.toHaveBeenCalled();
  });

  it("returns 401 when CRON_SECRET env var is unset", async () => {
    delete process.env.CRON_SECRET;

    const res = await POST(makeRequest("Bearer anything"));
    expect(res.status).toBe(401);
    expect(runIngestionSyncMock).not.toHaveBeenCalled();
  });

  it("returns 200 { executed: false } when cron config is disabled", async () => {
    getDecryptedCredentialMock.mockResolvedValueOnce({
      enabled: false,
      intervalHours: 12,
    });

    const res = await POST(makeRequest("Bearer super-secret-cron-token"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ executed: false });
    expect(runIngestionSyncMock).not.toHaveBeenCalled();
  });

  it("returns 200 { executed: false } when last finished run is within intervalHours", async () => {
    getDecryptedCredentialMock.mockResolvedValueOnce({
      enabled: true,
      intervalHours: 12,
    });
    listRecentIngestionRunsMock.mockResolvedValueOnce([
      {
        id: 1,
        source: "france_travail",
        status: "success",
        fetchedCount: 5,
        insertedCount: 2,
        updatedCount: 3,
        dedupedCount: 0,
        errorMessage: null,
        startedAt: new Date(Date.now() - 2 * 3600_000),
        finishedAt: new Date(Date.now() - 2 * 3600_000),
      },
    ]);

    const res = await POST(makeRequest("Bearer super-secret-cron-token"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ executed: false });
    expect(runIngestionSyncMock).not.toHaveBeenCalled();
  });

  it("executes runIngestionSync when enabled and intervalHours has elapsed", async () => {
    getDecryptedCredentialMock.mockResolvedValueOnce({
      enabled: true,
      intervalHours: 6,
    });
    listRecentIngestionRunsMock.mockResolvedValueOnce([
      {
        id: 1,
        source: "france_travail",
        status: "success",
        fetchedCount: 5,
        insertedCount: 2,
        updatedCount: 3,
        dedupedCount: 0,
        errorMessage: null,
        startedAt: new Date(Date.now() - 7 * 3600_000),
        finishedAt: new Date(Date.now() - 7 * 3600_000),
      },
    ]);
    const runs = [
      {
        id: 2,
        source: "france_travail",
        status: "success",
        fetchedCount: 3,
        insertedCount: 3,
        updatedCount: 0,
        dedupedCount: 0,
        errorMessage: null,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    ];
    runIngestionSyncMock.mockResolvedValueOnce({ runs });

    const res = await POST(makeRequest("Bearer super-secret-cron-token"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.executed).toBe(true);
    expect(body.runs).toHaveLength(1);
    expect(runIngestionSyncMock).toHaveBeenCalledWith({ trigger: "cron" });
  });
});
