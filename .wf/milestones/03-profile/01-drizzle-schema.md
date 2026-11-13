---
id: M3-01
phase: 1
role: api
status: done
branch: feat/m3-01-drizzle-schema
needs: [M1-02]
---
# Drizzle schema + migrations (profil singleton)

## Decisions

- **Drizzle ORM** + **`drizzle-kit`** for migrations; driver **`drizzle-orm/node-postgres`** with existing **`pg`** pool.
- **Single-tenant:** one logical user per instance — table `profiles` holds exactly **one row** with **`id = 1`** (app always reads/writes `1`; no auth, no multi-user).
- **Normalized** children: `profile_skills`, `profile_experiences`; **CV** text + ATS snapshot on `profile_cv` (1:1 with profile).
- **No CV file persistence** — only `extracted_text` + upload metadata after parse (see M3-02).
- **Privacy (compliance):** profile/CV = PII local instance; purpose = job search scoring (M5) and candidature draft (M6); retention = until user clears data (future; M3 = update/replace only); **no PII in logs**; `DATABASE_URL` only from env.
- **Threat (STRIDE-lite):** upload endpoint is unauthenticated local app — mitigate with **size/type validation** and parse in Server Action only (M3-02).
- **dependenciesChanged:** yes (`drizzle-orm`, `drizzle-kit`).

## Structure

| Path | Purpose |
|------|---------|
| `src/server/db/client.ts` | `pg` pool + Drizzle instance |
| `src/server/db/schema.ts` | Drizzle table definitions |
| `drizzle.config.ts` | drizzle-kit config |
| `drizzle/` | Generated SQL migrations |

## Contract

**Dependencies** (executor adds):

```bash
npm install drizzle-orm
npm install -D drizzle-kit
```

**`drizzle.config.ts`:**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**`package.json` scripts** (add):

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate"
```

**Enums (Postgres + TS)** — use Drizzle `pgEnum`:

| Enum | Values |
|------|--------|
| `remote_preference` | `onsite`, `hybrid`, `remote`, `flexible` |
| `contract_type` | `cdi`, `cdd`, `alternance`, `freelance`, `interim`, `stage` |

**Tables** (Drizzle `schema.ts` — semantic minimum):

```typescript
// profiles — single row id=1
// columns:
//   id: serial PK (seed forces 1)
//   full_name: varchar(200) not null default ''
//   headline: varchar(300) default ''
//   email: varchar(320) default ''
//   phone: varchar(40) default ''
//   location_label: varchar(200) not null default ''  // ville/région libre
//   search_radius_km: integer not null default 30 check 0..500
//   remote_preference: remote_preference not null default 'flexible'
//   min_salary_annual_gross: integer null  // EUR, null = pas de plancher
//   contract_types: contract_type[] not null default '{}'
//   created_at, updated_at: timestamptz not null default now()

// profile_skills
//   id: serial PK
//   profile_id: int FK profiles(id) on delete cascade
//   label: varchar(120) not null
//   sort_order: int not null default 0
// unique (profile_id, lower(label))

// profile_experiences
//   id: serial PK
//   profile_id: int FK profiles(id) on delete cascade
//   title: varchar(200) not null
//   company: varchar(200) not null default ''
//   location: varchar(200) default ''
//   start_date: date not null
//   end_date: date null  // null = en cours
//   description: text not null default ''
//   sort_order: int not null default 0

// profile_cv
//   profile_id: int PK FK profiles(id) on delete cascade
//   original_filename: varchar(255) not null
//   mime_type: varchar(100) not null  // application/pdf | application/vnd.openxmlformats-officedocument.wordprocessingml.document
//   extracted_text: text not null default ''
//   uploaded_at: timestamptz null
//   ats_score: smallint null check 0..100
//   ats_findings: jsonb not null default '[]'
//   ats_analyzed_at: timestamptz null
```

**Initial migration** must:

1. Create enums + tables.
2. Insert seed row: `INSERT INTO profiles (id, ...) VALUES (1, ...) ON CONFLICT DO NOTHING` (or equivalent ensuring row `1` exists).

**`src/server/db/client.ts`:**

- Export `getDb()` returning Drizzle bound to a shared pool.
- Read `DATABASE_URL`; throw clear error at startup in dev if missing (no default secrets).

## Open questions

- None for this phase (locked in discuss).

## Todos

- [x] Install `drizzle-orm` and `drizzle-kit` per Contract (`package.json`)
- [x] Add `drizzle.config.ts` at repo root exactly as Contract
- [x] Add `src/server/db/schema.ts` with enums and tables exactly as Contract
- [x] Add `src/server/db/client.ts` per Contract (`getDb()`, `DATABASE_URL`, no default secrets)
- [x] Add `package.json` scripts `db:generate` and `db:migrate` per Contract
- [x] Run `npm run db:generate` and commit migration SQL under `drizzle/` including seed row `profiles.id = 1`
- [x] Test: `npm run db:migrate` against local Postgres (`DATABASE_URL`) completes without error
- [x] Test: `npm run build` and `npx tsc --noEmit` pass with db module wired

## UAT

- [x] (auto) With `db` up (Docker or host), `npm run db:migrate` succeeds
- [x] (auto) After migrate, Postgres has tables `profiles`, `profile_skills`, `profile_experiences`, `profile_cv` and exactly one `profiles` row with `id = 1`
- [x] (auto) `npm run build` succeeds
- [x] (auto) `npm audit --audit-level=high` pass (shared-audit §1 — deps changed)
