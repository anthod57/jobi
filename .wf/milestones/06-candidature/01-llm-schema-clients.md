---
id: M6-01
phase: 1
role: api
status: done
branch: feat/m6-01-llm-schema-clients
needs: [M3-02, M4-02, M5-01]
---
# Schéma SQL `applications` + `llm_usage_logs`, config LLM chiffrée, clients HTTP & calculateur de coût

## Decisions

- **Tables dédiées `applications` et `llm_usage_logs` :**
  - `applications` : une ligne par offre (`offer_id` unique, FK `offer_id → job_offers.id` avec `onDelete: "cascade"`), stockant `status` (`draft | validated | sent | archived`), `tone` (`professional | direct | enthusiastic`), `custom_instructions`, `draft_subject`, `draft_body`, `notes`, `provider`, `model`, `sent_at`, `created_at`, `updated_at`.
  - `llm_usage_logs` : une ligne par appel de génération (`application_id` FK `applications.id` avec `onDelete: "cascade"`), stockant `provider`, `model`, `prompt_tokens`, `completion_tokens`, `total_tokens`, `estimated_cost_usd` (`numeric(10, 6)`), `created_at` — permet de cumuler le coût réel même en cas de régénération.
- **Stockage chiffré des clés & config LLM :** réutilisation de `integration_credentials` (`src/lib/ingestion/credentials-repository.ts`) en ajoutant les providers `llm_mistral`, `llm_openai`, `llm_anthropic` (payload `{ apiKey }`) et `llm_config` (payload `{ activeProvider, model }`).
- **Appels HTTP `fetch` directs (zéro SDK externe) :**
  - Mistral : `POST https://api.mistral.ai/v1/chat/completions` (défaut `mistral-small-latest`)
  - OpenAI : `POST https://api.openai.com/v1/chat/completions` (défaut `gpt-4o-mini`)
  - Anthropic : `POST https://api.anthropic.com/v1/messages` avec `anthropic-version: 2023-06-01` (défaut `claude-3-5-haiku-latest`)
  - Sortie JSON structurée `{ subject, body }` avec fallback parsing défensif + timeout `AbortSignal.timeout(30_000)`.
- **Grille tarifaire statique côté serveur :** table de prix USD par million de tokens (input/output) par modèle connu dans `src/lib/candidatures/pricing.ts` pour calculer `estimated_cost_usd` à partir des compteurs retournés par l'API (`0` si modèle inconnu).
- **Confidentialité & RGPD (`shared-compliance`) :**
  - Minimisation des données envoyées au LLM : uniquement `headline`, compétences, expériences (titre, entreprise, description) et extrait CV (tronqué à 6 000 caractères), **sans `email`, `phone` ni `fullName`** ; côté offre : `title`, `company`, `locationLabel`, `contractType`, `remoteMode`, `description` (tronquée à 6 000 caractères).
  - Aucune clé API ni prompt/PII dans les logs serveur ; requêtes Drizzle paramétrées.
- **dependenciesChanged:** no.

## Structure

| Path | Purpose |
|------|---------|
| `src/server/db/schema.ts` | Ajout enum `applicationStatusEnum`, `applicationToneEnum`, `llmProviderEnum`, tables `applications` et `llmUsageLogs` |
| `drizzle/` | Nouvelle migration SQL via `npm run db:generate` |
| `src/lib/ingestion/credentials-repository.ts` | Extension `CredentialProvider` pour `llm_mistral`, `llm_openai`, `llm_anthropic`, `llm_config` |
| `src/lib/candidatures/types.ts` | Types `LlmProvider`, `ApplicationStatus`, `ApplicationTone`, `ApplicationWithOffer`, `CandidatureStats` |
| `src/lib/candidatures/schemas.ts` | Schémas Zod (`llmKeySchema`, `llmConfigSchema`, `generateDraftSchema`, `updateApplicationSchema`, `applicationFiltersSchema`) |
| `src/lib/candidatures/pricing.ts` | Modèles par défaut + grille tarifaire + `estimateLlmCostUsd(provider, model, promptTokens, completionTokens)` |
| `src/lib/candidatures/prompt.ts` | `buildApplicationPrompt(offer, profile, tone, customInstructions)` sans PII de contact |
| `src/lib/candidatures/llm-client.ts` | `generateWithLlm(provider, apiKey, model, prompt)` via `fetch` + parsing `{ subject, body }` |
| `src/lib/candidatures/repository.ts` | CRUD `applications`, insertion `llm_usage_logs`, `getApplicationByOfferId`, `listApplications`, `getCandidatureStats` |

## Contract

**`src/server/db/schema.ts`** (ajouts) :

```typescript
export const applicationStatusEnum = pgEnum("application_status", [
  "draft",
  "validated",
  "sent",
  "archived",
]);

export const applicationToneEnum = pgEnum("application_tone", [
  "professional",
  "direct",
  "enthusiastic",
]);

export const llmProviderEnum = pgEnum("llm_provider", [
  "mistral",
  "openai",
  "anthropic",
]);

export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    offerId: integer("offer_id")
      .notNull()
      .references(() => jobOffers.id, { onDelete: "cascade" }),
    status: applicationStatusEnum("status").notNull().default("draft"),
    tone: applicationToneEnum("tone").notNull().default("professional"),
    customInstructions: text("custom_instructions").notNull().default(""),
    draftSubject: varchar("draft_subject", { length: 300 }).notNull().default(""),
    draftBody: text("draft_body").notNull().default(""),
    notes: text("notes").notNull().default(""),
    provider: llmProviderEnum("provider").notNull(),
    model: varchar("model", { length: 120 }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("applications_offer_id_unique").on(table.offerId),
  ],
);

export const llmUsageLogs = pgTable("llm_usage_logs", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  provider: llmProviderEnum("provider").notNull(),
  model: varchar("model", { length: 120 }).notNull(),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  estimatedCostUsd: varchar("estimated_cost_usd", { length: 24 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});
```

**`src/lib/candidatures/schemas.ts`** :

```typescript
import { z } from "zod";

export const llmProviderSchema = z.enum(["mistral", "openai", "anthropic"]);
export const applicationStatusSchema = z.enum(["draft", "validated", "sent", "archived"]);
export const applicationToneSchema = z.enum(["professional", "direct", "enthusiastic"]);

export const llmKeySchema = z.object({
  provider: llmProviderSchema,
  apiKey: z.string().trim().min(8).max(300),
});

export const llmConfigSchema = z.object({
  activeProvider: llmProviderSchema,
  model: z.string().trim().min(1).max(120),
});

export const generateDraftSchema = z.object({
  offerId: z.coerce.number().int().positive(),
  tone: applicationToneSchema.default("professional"),
  customInstructions: z.string().trim().max(600).default(""),
});

export const updateApplicationSchema = z.object({
  applicationId: z.coerce.number().int().positive(),
  status: applicationStatusSchema.optional(),
  draftSubject: z.string().trim().max(300).optional(),
  draftBody: z.string().trim().max(15000).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export const applicationFiltersSchema = z.object({
  status: applicationStatusSchema.optional(),
  q: z.string().trim().max(120).default(""),
});
```

**`src/lib/candidatures/types.ts`** :

```typescript
export interface LlmGenerationResult {
  subject: string;
  body: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface CandidatureStats {
  totalApplications: number;
  byStatus: Record<"draft" | "validated" | "sent" | "archived", number>;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  usageByProvider: Array<{
    provider: "mistral" | "openai" | "anthropic";
    calls: number;
    totalTokens: number;
    costUsd: number;
  }>;
}
```

## Todos

- [x] Add `src/server/db/schema.ts` enums & tables (`applicationStatusEnum`, `applicationToneEnum`, `llmProviderEnum`, `applications`, `llmUsageLogs`) exactly as Contract and generate migration in `drizzle/` via `npm run db:generate`
- [x] Add `src/lib/candidatures/types.ts` and `src/lib/candidatures/schemas.ts` exactly as Contract
- [x] Extend `src/lib/ingestion/credentials-repository.ts` (`CredentialProvider` + `PROVIDERS`) to support `llm_mistral`, `llm_openai`, `llm_anthropic`, `llm_config`
- [x] Test: `src/lib/candidatures/pricing.test.ts` — spec `estimateLlmCostUsd` for known Mistral/OpenAI/Anthropic models, unknown model fallback (`0`), and `getDefaultModelForProvider` (fails until `pricing.ts` implemented)
- [x] Add `src/lib/candidatures/pricing.ts` — default models, static USD per 1M token table, and `estimateLlmCostUsd`
- [x] Test: `src/lib/candidatures/prompt.test.ts` — spec `buildApplicationPrompt` includes offer/skills/experiences/CV excerpt, excludes `email`/`phone`/`fullName`, and truncates long inputs (fails until `prompt.ts` implemented)
- [x] Add `src/lib/candidatures/prompt.ts` — implement `buildApplicationPrompt` with PII minimization and 6 000 char caps
- [x] Test: `src/lib/candidatures/llm-client.test.ts` — spec `generateWithLlm` (`fetch` mock) for Mistral, OpenAI, and Anthropic payloads, JSON `{ subject, body }` extraction, fallback parsing, and error handling (fails until `llm-client.ts` implemented)
- [x] Add `src/lib/candidatures/llm-client.ts` — implement `generateWithLlm` using direct `fetch` with `AbortSignal.timeout(30_000)` and defensive JSON parsing
- [x] Test: `src/lib/candidatures/repository.test.ts` — spec `saveGeneratedApplication`, `updateApplication`, `getApplicationByOfferId`, `listApplications`, and `getCandidatureStats` (cumulative `llm_usage_logs` tokens & cost) (fails until `repository.ts` implemented)
- [x] Add `src/lib/candidatures/repository.ts` — implement Drizzle queries & mutations for `applications` and `llm_usage_logs`
- [x] Test: `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npm test` pass

## UAT

- [x] (auto) `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npm test` exit 0
- [x] (auto) Drizzle migration applies cleanly on Postgres (`applications` and `llm_usage_logs` tables created with expected FKs and unique `offer_id`)
- [x] (auto) `pricing.test.ts`, `prompt.test.ts`, `llm-client.test.ts`, and `repository.test.ts` pass without skipped assertions (`buildApplicationPrompt` verified to omit email/phone/fullName)
