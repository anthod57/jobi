import { eq } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import { integrationCredentials } from "@/server/db/schema";

import { buildKeyHint, decryptSecretJson, encryptSecretJson } from "./crypto";

export type CredentialProvider = "france_travail" | "adzuna" | "ingestion_cron";

export type FranceTravailCredentials = {
  clientId: string;
  clientSecret: string;
};

export type AdzunaCredentials = {
  appId: string;
  appKey: string;
};

export type IngestionCronConfig = {
  enabled: boolean;
  intervalHours: number; // 6 | 12 | 24
};

export type CredentialStatus = {
  provider: CredentialProvider;
  configured: boolean;
  keyHint: string;
  updatedAt: Date | null;
};

const PROVIDERS: readonly CredentialProvider[] = [
  "france_travail",
  "adzuna",
  "ingestion_cron",
];

/** Encrypts and upserts provider credentials into `integration_credentials`. */
export async function saveEncryptedCredential(
  provider: CredentialProvider,
  payload: unknown,
  hintSource: string,
): Promise<void> {
  // Encrypt before opening/calling DB write so invalid APP_ENCRYPTION_KEY fails fast.
  const encryptedPayload = encryptSecretJson(payload);
  const keyHint = buildKeyHint(hintSource);
  const now = new Date();

  const db = getDb();
  await db
    .insert(integrationCredentials)
    .values({
      provider,
      encryptedPayload,
      keyHint,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: integrationCredentials.provider,
      set: {
        encryptedPayload,
        keyHint,
        updatedAt: now,
      },
    });
}

/** Server-only helper that decrypts stored credentials for `provider`, or returns `null`. */
export async function getDecryptedCredential<T>(
  provider: CredentialProvider,
): Promise<T | null> {
  const db = getDb();
  const rows = await db
    .select({ encryptedPayload: integrationCredentials.encryptedPayload })
    .from(integrationCredentials)
    .where(eq(integrationCredentials.provider, provider))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  return decryptSecretJson<T>(rows[0].encryptedPayload);
}

/** Lists configuration status and masked `keyHint` for all providers without exposing secrets. */
export async function listCredentialStatuses(): Promise<CredentialStatus[]> {
  const db = getDb();
  const rows = await db
    .select({
      provider: integrationCredentials.provider,
      keyHint: integrationCredentials.keyHint,
      updatedAt: integrationCredentials.updatedAt,
    })
    .from(integrationCredentials);

  const byProvider = new Map(rows.map((row) => [row.provider, row]));

  return PROVIDERS.map((provider) => {
    const row = byProvider.get(provider);
    if (!row) {
      return {
        provider,
        configured: false,
        keyHint: "",
        updatedAt: null,
      };
    }

    return {
      provider,
      configured: true,
      keyHint: row.keyHint,
      updatedAt: row.updatedAt,
    };
  });
}
