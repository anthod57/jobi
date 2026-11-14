import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockSaveEncryptedCredential,
  mockRunIngestionSync,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockSaveEncryptedCredential: vi.fn(),
  mockRunIngestionSync: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/ingestion/credentials-repository", () => ({
  saveEncryptedCredential: mockSaveEncryptedCredential,
}));

vi.mock("@/lib/ingestion/sync", () => ({
  runIngestionSync: mockRunIngestionSync,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import {
  saveCronConfigAction,
  saveLlmConfigAction,
  saveLlmKeyAction,
  saveProviderCredentialsAction,
  triggerManualIngestionAction,
  type SettingsActionState,
} from "./actions";

const INITIAL_STATE: SettingsActionState = { ok: false, message: "" };

describe("saveProviderCredentialsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unknown provider", async () => {
    const fd = new FormData();
    fd.set("provider", "unknown");

    const res = await saveProviderCredentialsAction(INITIAL_STATE, fd);
    expect(res.ok).toBe(false);
    expect(mockSaveEncryptedCredential).not.toHaveBeenCalled();
  });

  it("validates required France Travail fields", async () => {
    const fd = new FormData();
    fd.set("provider", "france_travail");
    fd.set("clientId", "   ");
    fd.set("clientSecret", "secret");

    const res = await saveProviderCredentialsAction(INITIAL_STATE, fd);
    expect(res.ok).toBe(false);
    expect(mockSaveEncryptedCredential).not.toHaveBeenCalled();
  });

  it("encrypts and saves France Travail credentials and revalidates", async () => {
    mockSaveEncryptedCredential.mockResolvedValueOnce(undefined);
    const fd = new FormData();
    fd.set("provider", "france_travail");
    fd.set("clientId", "PAR_client_1234");
    fd.set("clientSecret", "secret_xyz");

    const res = await saveProviderCredentialsAction(INITIAL_STATE, fd);
    expect(res.ok).toBe(true);
    expect(mockSaveEncryptedCredential).toHaveBeenCalledWith(
      "france_travail",
      { clientId: "PAR_client_1234", clientSecret: "secret_xyz" },
      "PAR_client_1234",
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/parametres");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/offres");
  });

  it("validates required Adzuna fields", async () => {
    const fd = new FormData();
    fd.set("provider", "adzuna");
    fd.set("appId", "app_1");
    fd.set("appKey", "");

    const res = await saveProviderCredentialsAction(INITIAL_STATE, fd);
    expect(res.ok).toBe(false);
    expect(mockSaveEncryptedCredential).not.toHaveBeenCalled();
  });

  it("encrypts and saves Adzuna credentials and revalidates", async () => {
    mockSaveEncryptedCredential.mockResolvedValueOnce(undefined);
    const fd = new FormData();
    fd.set("provider", "adzuna");
    fd.set("appId", "adzuna_id_99");
    fd.set("appKey", "adzuna_key_88");

    const res = await saveProviderCredentialsAction(INITIAL_STATE, fd);
    expect(res.ok).toBe(true);
    expect(mockSaveEncryptedCredential).toHaveBeenCalledWith(
      "adzuna",
      { appId: "adzuna_id_99", appKey: "adzuna_key_88" },
      "adzuna_id_99",
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/parametres");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/offres");
  });

  it("returns error message when encryption or DB save fails", async () => {
    mockSaveEncryptedCredential.mockRejectedValueOnce(
      new Error("APP_ENCRYPTION_KEY manquante"),
    );
    const fd = new FormData();
    fd.set("provider", "france_travail");
    fd.set("clientId", "PAR_client_1234");
    fd.set("clientSecret", "secret_xyz");

    const res = await saveProviderCredentialsAction(INITIAL_STATE, fd);
    expect(res.ok).toBe(false);
    expect(res.message).toContain("APP_ENCRYPTION_KEY");
  });
});

describe("saveCronConfigAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unsupported intervalHours values", async () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("intervalHours", "3");

    const res = await saveCronConfigAction(INITIAL_STATE, fd);
    expect(res.ok).toBe(false);
    expect(mockSaveEncryptedCredential).not.toHaveBeenCalled();
  });

  it("saves cron config with enabled flag and valid intervalHours", async () => {
    mockSaveEncryptedCredential.mockResolvedValueOnce(undefined);
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("intervalHours", "12");

    const res = await saveCronConfigAction(INITIAL_STATE, fd);
    expect(res.ok).toBe(true);
    expect(mockSaveEncryptedCredential).toHaveBeenCalledWith(
      "ingestion_cron",
      { enabled: true, intervalHours: 12 },
      "cron:12h",
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/parametres");
  });
});

describe("triggerManualIngestionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns failure when sync is already running", async () => {
    mockRunIngestionSync.mockResolvedValueOnce({
      runs: [],
      skippedReason: "already_running",
    });

    const res = await triggerManualIngestionAction();
    expect(mockRunIngestionSync).toHaveBeenCalledWith({ trigger: "manual" });
    expect(res.ok).toBe(false);
  });

  it("returns failure when no provider is configured", async () => {
    mockRunIngestionSync.mockResolvedValueOnce({ runs: [] });

    const res = await triggerManualIngestionAction();
    expect(res.ok).toBe(false);
  });

  it("returns success summary and revalidates paths when runs complete", async () => {
    mockRunIngestionSync.mockResolvedValueOnce({
      runs: [
        {
          id: 1,
          source: "france_travail",
          status: "success",
          fetchedCount: 10,
          insertedCount: 6,
          updatedCount: 2,
          dedupedCount: 2,
          errorMessage: null,
          startedAt: new Date(),
          finishedAt: new Date(),
        },
      ],
    });

    const res = await triggerManualIngestionAction();
    expect(res.ok).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/parametres");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/offres");
  });
});

describe("saveLlmKeyAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unknown LLM provider", async () => {
    const fd = new FormData();
    fd.set("provider", "gemini");
    fd.set("apiKey", "sk-test-12345678");

    const res = await saveLlmKeyAction(INITIAL_STATE, fd);
    expect(res.ok).toBe(false);
    expect(mockSaveEncryptedCredential).not.toHaveBeenCalled();
  });

  it("rejects too short apiKey without echoing it", async () => {
    const fd = new FormData();
    fd.set("provider", "mistral");
    fd.set("apiKey", "short");

    const res = await saveLlmKeyAction(INITIAL_STATE, fd);
    expect(res.ok).toBe(false);
    expect(res.message).not.toContain("short");
    expect(mockSaveEncryptedCredential).not.toHaveBeenCalled();
  });

  it("encrypts and stores LLM key for mistral/openai/anthropic without echoing key", async () => {
    mockSaveEncryptedCredential.mockResolvedValueOnce(undefined);
    const fd = new FormData();
    fd.set("provider", "openai");
    fd.set("apiKey", "sk-proj-secret-abcdef1234");

    const res = await saveLlmKeyAction(INITIAL_STATE, fd);
    expect(res.ok).toBe(true);
    expect(res.message).not.toContain("sk-proj-secret-abcdef1234");
    expect(mockSaveEncryptedCredential).toHaveBeenCalledWith(
      "llm_openai",
      { apiKey: "sk-proj-secret-abcdef1234" },
      "sk-proj-secret-abcdef1234",
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/parametres");
  });

  it("returns error message when encryption fails", async () => {
    mockSaveEncryptedCredential.mockRejectedValueOnce(
      new Error("APP_ENCRYPTION_KEY manquante"),
    );
    const fd = new FormData();
    fd.set("provider", "anthropic");
    fd.set("apiKey", "sk-ant-secret-123456");

    const res = await saveLlmKeyAction(INITIAL_STATE, fd);
    expect(res.ok).toBe(false);
    expect(res.message).toContain("APP_ENCRYPTION_KEY");
    expect(res.message).not.toContain("sk-ant-secret-123456");
  });
});

describe("saveLlmConfigAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid activeProvider or empty model", async () => {
    const fd = new FormData();
    fd.set("activeProvider", "mistral");
    fd.set("model", "   ");

    const res = await saveLlmConfigAction(INITIAL_STATE, fd);
    expect(res.ok).toBe(false);
    expect(mockSaveEncryptedCredential).not.toHaveBeenCalled();
  });

  it("saves active LLM provider and model and revalidates", async () => {
    mockSaveEncryptedCredential.mockResolvedValueOnce(undefined);
    const fd = new FormData();
    fd.set("activeProvider", "anthropic");
    fd.set("model", "claude-3-5-sonnet-latest");

    const res = await saveLlmConfigAction(INITIAL_STATE, fd);
    expect(res.ok).toBe(true);
    expect(mockSaveEncryptedCredential).toHaveBeenCalledWith(
      "llm_config",
      { activeProvider: "anthropic", model: "claude-3-5-sonnet-latest" },
      "anthropic:claude-3-5-sonnet-latest",
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/parametres");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/candidatures");
  });
});
