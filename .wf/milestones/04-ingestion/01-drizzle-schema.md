---
id: M4-01
phase: 1
role: api
status: done
branch: feat/m4-01-drizzle-schema
needs: [M3-01]
---
# Drizzle schema + migrations (offres, sources, runs, credentials)

## Decisions

- **Modèle canonique dédupliqué :** table `job_offers` (une ligne par offre logique, clé unique `dedup_key` SHA-256 hex sur `title + company + location` normalisés) + table enfant `job_offer_sources` (une ligne par source avec contrainte unique `(source, external_id)` et `raw_payload` JSONB).
- **Réutilisation enums M3 :** `contract_type` et `remote_preference` déjà définis dans `src/server/db/schema.ts` sont réutilisés pour `job_offers`.
- **Historique d’ingestion :** table `ingestion_runs` (`france_travail` | `adzuna`, statut `running` | `success` | `partial` | `error`, compteurs fetched/inserted/updated/deduped).
- **Credentials API en base :** table `integration_credentials` (`provider` PK `varchar(40)` — supporte `france_travail`, `adzuna`, et futur `llm` sans migration enum), payload chiffré **AES-256-GCM** côté serveur via `APP_ENCRYPTION_KEY` (`.env`), plus `key_hint` masqué.
- **Compliance & sécurité :**
  - Secrets jamais renvoyés en clair au client ni loggés ; `APP_ENCRYPTION_KEY` (32 octets hex/base64) lue uniquement depuis `process.env`.
  - Offres importées stockées uniquement en base locale Docker (respect des CGU France Travail / Adzuna : pas de revente ni redistribution).
  - **Threat (STRIDE-lite) :** fuite de clés API en cas d’accès à la base — mitigée par chiffrement AES-256-GCM au repos et séparation de la clé maître en variable d’environnement.
- **dependenciesChanged:** no.

## Structure

| Path | Purpose |
|------|---------|
| `src/server/db/schema.ts` | Ajout des enums et tables `jobOffers`, `jobOfferSources`, `ingestionRuns`, `integrationCredentials` |
| `drizzle/` | Nouvelle migration SQL générée via `npm run db:generate` |
| `.env.example` | Ajout de `APP_ENCRYPTION_KEY` (exemple / documentation) |

## Contract

**`src/server/db/schema.ts`** (ajouts aux imports `boolean` et à la suite du schéma M3) :

```typescript
export const offerSourceEnum = pgEnum("offer_source", [
  "france_travail",
  "adzuna",
]);

export const ingestionRunStatusEnum = pgEnum("ingestion_run_status", [
  "running",
  "success",
  "partial",
  "error",
]);

export const jobOffers = pgTable(
  "job_offers",
  {
    id: serial("id").primaryKey(),
    dedupKey: varchar("dedup_key", { length: 64 }).notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    company: varchar("company", { length: 200 }).notNull().default(""),
    locationLabel: varchar("location_label", { length: 200 })
      .notNull()
      .default(""),
    department: varchar("department", { length: 20 }),
    contractType: contractTypeEnum("contract_type"),
    remoteMode: remotePreferenceEnum("remote_mode"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryText: varchar("salary_text", { length: 200 }),
    description: text("description").notNull().default(""),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("job_offers_dedup_key_unique").on(table.dedupKey),
    check(
      "job_offers_salary_range_check",
      sql`${table.salaryMin} IS NULL OR ${table.salaryMax} IS NULL OR ${table.salaryMin} <= ${table.salaryMax}`,
    ),
  ],
);

export const jobOfferSources = pgTable(
  "job_offer_sources",
  {
    id: serial("id").primaryKey(),
    offerId: integer("offer_id")
      .notNull()
      .references(() => jobOffers.id, { onDelete: "cascade" }),
    source: offerSourceEnum("source").notNull(),
    externalId: varchar("external_id", { length: 160 }).notNull(),
    url: text("url").notNull().default(""),
    rawPayload: jsonb("raw_payload").notNull().default(sql`'{}'::jsonb`),
    fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("job_offer_sources_source_external_id_unique").on(
      table.source,
      table.externalId,
    ),
  ],
);

export const ingestionRuns = pgTable("ingestion_runs", {
  id: serial("id").primaryKey(),
  source: offerSourceEnum("source").notNull(),
  status: ingestionRunStatusEnum("status").notNull(),
  fetchedCount: integer("fetched_count").notNull().default(0),
  insertedCount: integer("inserted_count").notNull().default(0),
  updatedCount: integer("updated_count").notNull().default(0),
  dedupedCount: integer("deduped_count").notNull().default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true, mode: "date" }),
});

export const integrationCredentials = pgTable("integration_credentials", {
  provider: varchar("provider", { length: 40 }).primaryKey(),
  encryptedPayload: text("encrypted_payload").notNull(),
  keyHint: varchar("key_hint", { length: 32 }).notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});
```

**`.env.example`** (ajout) :

```env
APP_ENCRYPTION_KEY=replace-with-64-hex-chars-or-32-byte-base64
```

## Todos

- [x] Update `src/server/db/schema.ts` with `boolean` import and `offerSourceEnum`, `ingestionRunStatusEnum`, `jobOffers`, `jobOfferSources`, `ingestionRuns`, `integrationCredentials` exactly as Contract
- [x] Add `APP_ENCRYPTION_KEY` example entry to `.env.example` exactly as Contract
- [x] Run `npm run db:generate` to generate the Drizzle SQL migration under `drizzle/`
- [x] Test: `npm run db:migrate` against local Postgres (`DATABASE_URL`) applies the new migration without error
- [x] Test: `npx tsc --noEmit` and `npm run build` pass with updated schema

## UAT

- [x] (auto) With `db` up (Docker or host), `npm run db:migrate` succeeds and applies the M4 migration
- [x] (auto) After migrate, Postgres has tables `job_offers`, `job_offer_sources`, `ingestion_runs`, `integration_credentials`, enums `offer_source`, `ingestion_run_status`, unique indexes `job_offers_dedup_key_unique` and `job_offer_sources_source_external_id_unique`, and check constraint `job_offers_salary_range_check`
- [x] (auto) `.env.example` documents `APP_ENCRYPTION_KEY` without real secrets
- [x] (auto) `npx tsc --noEmit` and `npm run build` succeed
