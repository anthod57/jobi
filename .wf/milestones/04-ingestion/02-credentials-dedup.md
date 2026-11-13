---
id: M4-02
phase: 2
role: api
status: review
branch: feat/m4-02-credentials-dedup
needs: [M4-01]
---
# Chiffrement credentials + normalisation & déduplication d'offres

## Decisions

- **Chiffrement au repos :** `node:crypto` AES-256-GCM (`iv` aléatoire 12 octets + `authTag` 16 octets + `ciphertext`, encodés en base64 séparés par `.` : `v1.<iv>.<tag>.<data>`). Clé maître lue depuis `process.env.APP_ENCRYPTION_KEY` (64 caractères hexadécimaux ou 32 octets base64). Aucune dépendance externe (`dependenciesChanged: no`).
- **Masquage des secrets :** `integration_credentials.key_hint` stocke au maximum les 4 derniers caractères de l'identifiant principal (`…abcd`) ; aucune fonction publique ni Server Action ne renvoie les credentials déchiffrés au client.
- **Clé de déduplication :** `computeDedupKey({ title, company, locationLabel })` normalise chaque champ (NFD sans diacritiques, minuscules, ponctuation remplacée par espaces, espaces condensés, trim) puis calcule le SHA-256 hexadécimal sur `${title}|${company}|${locationLabel}`.
- **Règle d'upsert dédupliqué (`upsertOfferWithSource`) :** dans une transaction Drizzle :
  1. Si `(source, externalId)` existe déjà dans `job_offer_sources`, mettre à jour `rawPayload`, `url`, `fetchedAt` et `job_offers.lastSeenAt` (+ champs non vides si manquants) → `outcome: "updated"`.
  2. Sinon si `dedupKey` existe déjà dans `job_offers`, insérer une nouvelle ligne `job_offer_sources` liée à cet `offerId` et mettre à jour `job_offers.lastSeenAt` → `outcome: "deduped"`.
  3. Sinon, insérer dans `job_offers` puis `job_offer_sources` → `outcome: "inserted"`.
- **Compliance & sécurité :** les secrets ne sont jamais loggés ; `APP_ENCRYPTION_KEY` manquante ou de longueur invalide lève une erreur explicite avant toute écriture en base.

## Structure

| Path | Purpose |
|------|---------|
| `src/lib/ingestion/crypto.ts` | Chiffrement/déchiffrement AES-256-GCM et génération de `keyHint` |
| `src/lib/ingestion/credentials-repository.ts` | CRUD chiffré sur `integration_credentials` + lecture statut masqué |
| `src/lib/ingestion/dedup.ts` | Normalisation texte et calcul `computeDedupKey` |
| `src/lib/ingestion/offer-repository.ts` | Upsert transactionnel dédupliqué (`job_offers` + `job_offer_sources`) |

## Contract

**`src/lib/ingestion/crypto.ts`** :

```typescript
export function encryptSecretJson(payload: unknown, rawKey?: string): string;
export function decryptSecretJson<T>(encrypted: string, rawKey?: string): T;
export function buildKeyHint(identifier: string): string;
```

**`src/lib/ingestion/credentials-repository.ts`** :

```typescript
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

export async function saveEncryptedCredential(
  provider: CredentialProvider,
  payload: unknown,
  hintSource: string,
): Promise<void>;

export async function getDecryptedCredential<T>(
  provider: CredentialProvider,
): Promise<T | null>;

export async function listCredentialStatuses(): Promise<CredentialStatus[]>;
```

**`src/lib/ingestion/dedup.ts`** :

```typescript
export function normalizeDedupText(value: string): string;

export function computeDedupKey(input: {
  title: string;
  company: string;
  locationLabel: string;
}): string; // 64-char lowercase hex SHA-256
```

**`src/lib/ingestion/offer-repository.ts`** :

```typescript
export type OfferSource = "france_travail" | "adzuna";
export type ContractType = "cdi" | "cdd" | "alternance" | "freelance" | "interim" | "stage";
export type RemoteMode = "onsite" | "hybrid" | "remote" | "flexible";

export type NormalizedOfferInput = {
  source: OfferSource;
  externalId: string;
  url: string;
  title: string;
  company: string;
  locationLabel: string;
  department: string | null;
  contractType: ContractType | null;
  remoteMode: RemoteMode | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryText: string | null;
  description: string;
  publishedAt: Date | null;
  rawPayload: Record<string, unknown>;
};

export type UpsertOutcome = "inserted" | "updated" | "deduped";

export async function upsertOfferWithSource(
  input: NormalizedOfferInput,
): Promise<{ offerId: number; outcome: UpsertOutcome }>;
```

## Todos

- [x] Test: `src/lib/ingestion/crypto.test.ts` — round-trip AES-256-GCM `v1.<iv>.<tag>.<data>`, support clé hex 64 chars et base64 32 octets, erreur explicite si `APP_ENCRYPTION_KEY` manquante/invalide ou tag altéré, et `buildKeyHint` (`…abcd`) (doit échouer tant que `crypto.ts` n'est pas implémenté)
- [x] Add `src/lib/ingestion/crypto.ts` implementing `encryptSecretJson`, `decryptSecretJson`, and `buildKeyHint` per Contract (`node:crypto` AES-256-GCM, aucun log de secret)
- [x] Test: `src/lib/ingestion/credentials-repository.test.ts` — upsert chiffré sur `integration_credentials`, lecture déchiffrée (ou `null` si absent), et `listCredentialStatuses` retournant les 3 providers avec `keyHint` masqué et sans secret (doit échouer tant que `credentials-repository.ts` n'est pas implémenté)
- [x] Add `src/lib/ingestion/credentials-repository.ts` implementing `saveEncryptedCredential`, `getDecryptedCredential`, and `listCredentialStatuses` per Contract
- [x] Test: `src/lib/ingestion/dedup.test.ts` — normalisation NFD sans diacritiques, minuscules, ponctuation en espaces, condensation des espaces, trim, et `computeDedupKey` SHA-256 hex 64 chars déterministe (doit échouer tant que `dedup.ts` n'est pas implémenté)
- [x] Add `src/lib/ingestion/dedup.ts` implementing `normalizeDedupText` and `computeDedupKey` per Contract
- [x] Test: `src/lib/ingestion/offer-repository.test.ts` — les 3 issues transactionnelles de `upsertOfferWithSource`: `updated` (même `(source, externalId)`), `deduped` (source distincte, même `dedupKey`), et `inserted` (nouvelle offre + source) (doit échouer tant que `offer-repository.ts` n'est pas implémenté)
- [x] Add `src/lib/ingestion/offer-repository.ts` implementing `upsertOfferWithSource` in a Drizzle transaction per Decisions and Contract
- [x] Test: `npm test`, `npx tsc --noEmit`, and `npm run build` pass

## UAT

- [ ] (auto) `npm test` passe la suite `src/lib/ingestion/*.test.ts` (round-trip AES-256-GCM + rejet clé invalide, masquage `keyHint`, normalisation/SHA-256 `computeDedupKey`, et branches `inserted` / `updated` / `deduped` de `upsertOfferWithSource`)
- [ ] (auto) `listCredentialStatuses()` retourne uniquement `{ provider, configured, keyHint, updatedAt }` sans exposer de secret déchiffré ni `encryptedPayload`
- [ ] (auto) `APP_ENCRYPTION_KEY` manquante ou de longueur invalide lève une erreur explicite avant toute écriture en base, sans logger de secret
- [ ] (auto) `npx tsc --noEmit` et `npm run build` passent sans erreur avec les 4 modules du Contract en place
