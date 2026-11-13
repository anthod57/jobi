import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getDbMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  getDb: getDbMock,
}));

import { encryptSecretJson } from "./crypto";
import {
  getDecryptedCredential,
  listCredentialStatuses,
  saveEncryptedCredential,
  type AdzunaCredentials,
  type FranceTravailCredentials,
} from "./credentials-repository";

const HEX_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("credentials-repository", () => {
  const originalKey = process.env.APP_ENCRYPTION_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_ENCRYPTION_KEY = HEX_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.APP_ENCRYPTION_KEY;
    } else {
      process.env.APP_ENCRYPTION_KEY = originalKey;
    }
  });

  it("encrypts payload before upserting into integration_credentials", async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    const insert = vi.fn().mockReturnValue({ values });
    getDbMock.mockReturnValue({ insert });

    const creds: FranceTravailCredentials = {
      clientId: "ft_client_9876",
      clientSecret: "super-secret-value",
    };

    await saveEncryptedCredential("france_travail", creds, creds.clientId);

    expect(insert).toHaveBeenCalledTimes(1);
    const insertedValues = values.mock.calls[0][0] as {
      provider: string;
      encryptedPayload: string;
      keyHint: string;
    };
    expect(insertedValues.provider).toBe("france_travail");
    expect(insertedValues.keyHint).toBe("…9876");
    expect(insertedValues.encryptedPayload).toMatch(/^v1\./);
    expect(insertedValues.encryptedPayload).not.toContain("super-secret-value");
    expect(onConflictDoUpdate).toHaveBeenCalledTimes(1);
  });

  it("fails before touching the DB if APP_ENCRYPTION_KEY is missing", async () => {
    delete process.env.APP_ENCRYPTION_KEY;
    const insert = vi.fn();
    getDbMock.mockReturnValue({ insert });

    await expect(
      saveEncryptedCredential(
        "adzuna",
        { appId: "a", appKey: "b" },
        "a",
      ),
    ).rejects.toThrow(/APP_ENCRYPTION_KEY/);
    expect(insert).not.toHaveBeenCalled();
  });

  it("returns null when credential is absent and decrypts when present", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    getDbMock.mockReturnValue({ select });

    expect(await getDecryptedCredential<AdzunaCredentials>("adzuna")).toBeNull();

    const encrypted = encryptSecretJson(
      { appId: "adz_1", appKey: "adz_secret" },
      HEX_KEY,
    );
    limit.mockResolvedValueOnce([{ encryptedPayload: encrypted }]);

    const result = await getDecryptedCredential<AdzunaCredentials>("adzuna");
    expect(result).toEqual({ appId: "adz_1", appKey: "adz_secret" });
  });

  it("lists all 3 providers with masked hints and no secret fields", async () => {
    const updatedAt = new Date("2026-11-01T10:00:00Z");
    const from = vi.fn().mockResolvedValue([
      {
        provider: "france_travail",
        keyHint: "…1234",
        updatedAt,
      },
    ]);
    const select = vi.fn().mockReturnValue({ from });
    getDbMock.mockReturnValue({ select });

    const statuses = await listCredentialStatuses();
    expect(statuses).toEqual([
      {
        provider: "france_travail",
        configured: true,
        keyHint: "…1234",
        updatedAt,
      },
      {
        provider: "adzuna",
        configured: false,
        keyHint: "",
        updatedAt: null,
      },
      {
        provider: "ingestion_cron",
        configured: false,
        keyHint: "",
        updatedAt: null,
      },
    ]);

    for (const item of statuses) {
      expect(Object.keys(item).sort()).toEqual([
        "configured",
        "keyHint",
        "provider",
        "updatedAt",
      ]);
    }
  });
});
