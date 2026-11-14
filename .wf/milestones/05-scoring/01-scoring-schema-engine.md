---
id: M5-01
phase: 1
role: api
status: done
branch: feat/m5-01-scoring-schema-engine
needs: [M3-02, M4-03]
---
# Schéma SQL `offer_scores` + moteur de scoring déterministe + recalcul

## Decisions

- **Table dédiée `offer_scores` :** une ligne par couple `(offer_id, profile_id)` (PK sur `offer_id` pour le MVP mono-profil, FK `offer_id → job_offers.id` et `profile_id → profiles.id` avec `onDelete: "cascade"`). Contient `score` (`smallint` nullable, `0..100`), `breakdown` (`jsonb`), et `computed_at` (`timestamptz`).
- **Scoring 100 % déterministe (sans LLM) :** fonction pure `scoreOffer(offer, profile)` évaluant 6 critères pondérés (`skills`: 40, `title`: 15, `contract`: 15, `remote`: 10, `salary`: 10, `location`: 10).
- **Profil vide :** si le profil n'a ni compétences, ni titre (`headline`), ni types de contrat, ni salaire min, ni localisation, et `remotePreference === "flexible"`, `score` vaut `null` et `breakdown.isEmptyProfile === true`.
- **Critères absents sur l'offre ou le profil :** un critère non renseigné (ex: `salaryMin === null && salaryMax === null` sur l'offre, ou `minSalaryAnnualGross === null` sur le profil) passe en statut `"neutral"` et son poids est exclu du dénominateur (repondération sur les critères actifs ; si aucun critère actif, `score` = `null`).
- **Normalisation texte :** minuscules, suppression des accents (NFD), découpage en tokens alphanumériques pour éviter les faux positifs partiels.
- **Recalcul automatique :**
  - Après sauvegarde du profil (`src/app/profil/actions.ts` → `saveProfileAction`) : recalcul des scores de toutes les offres actives.
  - Après ingestion (`src/lib/ingestion/sync.ts` → `syncOffersForSource`) : recalcul des scores des offres insérées/mises à jour.
- **Requêtes de lecture :** `listScoredOffers(filters)` (jointure `job_offers` + `offer_scores` + sources agrégées, filtres Zod `q`, `contractType`, `remoteMode`, `source`, `minScore`, `sort`, `page`, `pageSize`) et `getScoredOfferById(id)`.
- **Compliance & sécurité :** données locales uniquement ; requêtes Drizzle paramétrées (pas d'interpolation SQL sur `q`).
- **dependenciesChanged:** no.

## Structure

| Path | Purpose |
|------|---------|
| `src/server/db/schema.ts` | Ajout de la table `offerScores` (`offer_scores`) |
| `drizzle/` | Nouvelle migration SQL via `npm run db:generate` |
| `src/lib/scoring/types.ts` | Types `ScoreCriterionKey`, `CriterionStatus`, `ScoreBreakdown`, `ScoredOfferItem`, `ScoredOfferDetail` |
| `src/lib/scoring/schemas.ts` | Schéma Zod `offerFiltersSchema` pour la liste `/offres` |
| `src/lib/scoring/score-offer.ts` | Fonction pure `scoreOffer(offer, profile)` + helpers de normalisation |
| `src/lib/scoring/score-repository.ts` | `recomputeScoresForAllOffers`, `recomputeScoresForOfferIds`, `listScoredOffers`, `getScoredOfferById` |
| `src/app/profil/actions.ts` | Appel `recomputeScoresForAllOffers()` après sauvegarde profil |
| `src/lib/ingestion/sync.ts` | Appel `recomputeScoresForOfferIds()` après upsert d'offres |

## Contract

**`src/server/db/schema.ts`** (ajout) :

```typescript
export const offerScores = pgTable(
  "offer_scores",
  {
    offerId: integer("offer_id")
      .primaryKey()
      .references(() => jobOffers.id, { onDelete: "cascade" }),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    score: smallint("score"),
    breakdown: jsonb("breakdown").notNull().default(sql`'{}'::jsonb`),
    computedAt: timestamp("computed_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "offer_scores_score_check",
      sql`${table.score} IS NULL OR (${table.score} >= 0 AND ${table.score} <= 100)`,
    ),
  ],
);
```

**`src/lib/scoring/types.ts`** :

```typescript
export type ScoreCriterionKey =
  | "skills"
  | "title"
  | "contract"
  | "remote"
  | "salary"
  | "location";

export type CriterionStatus = "matched" | "partial" | "mismatch" | "neutral";

export interface CriterionBreakdown {
  key: ScoreCriterionKey;
  weight: number;
  score: number | null;
  status: CriterionStatus;
  detail: string;
}

export interface ScoreBreakdown {
  isEmptyProfile: boolean;
  matchedSkills: string[];
  missingSkills: string[];
  criteria: CriterionBreakdown[];
}

export interface ScoreResult {
  score: number | null;
  breakdown: ScoreBreakdown;
}
```

**`src/lib/scoring/schemas.ts`** :

```typescript
import { z } from "zod";

export const offerFiltersSchema = z.object({
  q: z.string().trim().max(120).default(""),
  contractType: z
    .enum(["cdi", "cdd", "alternance", "freelance", "interim", "stage"])
    .optional(),
  remoteMode: z.enum(["onsite", "hybrid", "remote", "flexible"]).optional(),
  source: z.enum(["france_travail", "adzuna"]).optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  sort: z.enum(["score", "date"]).default("score"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type OfferFilters = z.infer<typeof offerFiltersSchema>;
```

## Todos

- [x] Add `offerScores` table to `src/server/db/schema.ts` exactly as Contract
- [x] Run `npm run db:generate` to generate Drizzle SQL migration in `drizzle/`
- [x] Add `src/lib/scoring/types.ts` and `src/lib/scoring/schemas.ts` exactly as Contract
- [x] Test: `src/lib/scoring/score-offer.test.ts` — spec `scoreOffer(offer, profile)` covering empty profile (`score: null`, `isEmptyProfile: true`), 6 weighted criteria (`skills`: 40, `title`: 15, `contract`: 15, `remote`: 10, `salary`: 10, `location`: 10), neutral re-weighting when criteria absent, NFD accent/case-insensitive token matching, and `matchedSkills`/`missingSkills` (fails until `score-offer.ts` implemented)
- [x] Add `src/lib/scoring/score-offer.ts` — implement pure deterministic `scoreOffer(offer, profile)` and text normalization helpers
- [x] Test: `src/lib/scoring/score-repository.test.ts` — spec `recomputeScoresForAllOffers`, `recomputeScoresForOfferIds`, `listScoredOffers` (filters `q`, `contractType`, `remoteMode`, `source`, `minScore`, `sort`, pagination), and `getScoredOfferById` (fails until `score-repository.ts` implemented)
- [x] Add `src/lib/scoring/score-repository.ts` — implement `recomputeScoresForAllOffers`, `recomputeScoresForOfferIds`, `listScoredOffers`, and `getScoredOfferById` using parameterized Drizzle queries
- [x] Update `src/app/profil/actions.ts` — call `recomputeScoresForAllOffers()` after `saveProfile` and `uploadCv` persist profile changes
- [x] Update `src/lib/ingestion/sync.ts` — call `recomputeScoresForOfferIds()` after `upsertOfferWithSource` inserts/updates offers in `syncSingleSource`
- [x] Test: `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npm test` pass

## UAT

- [x] (auto) `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npm test` exit 0
- [x] (auto) Drizzle migration in `drizzle/` applies cleanly and `offer_scores` table has PK `offer_id`, FK `profile_id`, and check constraint `0..100`
- [x] (auto) `scoreOffer` unit tests prove deterministic scoring, empty-profile `null` score, and neutral criterion re-weighting
- [x] (auto) Saving profile (`src/app/profil/actions.ts`) and syncing offers (`src/lib/ingestion/sync.ts`) trigger score recomputation in `offer_scores`
