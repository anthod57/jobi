---
id: M4-03
phase: 3
role: api
status: done
branch: feat/m4-03-api-clients-sync
needs: [M4-02]
---
# Clients API France Travail & Adzuna + orchestrateur & service cron Docker

## Decisions

- **Sources officielles uniquement :**
  - **France Travail :** OAuth2 `client_credentials` (`https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire`, scope `api_offresdemploiv2 o2dsoffre`) puis `GET https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search` (range `0-49`).
  - **Adzuna :** `GET https://api.adzuna.com/v1/api/jobs/fr/search/1` avec `app_id`, `app_key`, `results_per_page=50`.
- **Critères de recherche larges & fenêtre incrémentale :** `buildSearchQueryFromProfile()` lit `profiles` + `profile_skills` pour extraire uniquement des mots-clés larges (`headline` ou top compétences), **sans filtre géographique ni contrat restrictif à l'import** (afin de permettre la consultation carte / filtrage géo local en M5). Si le profil est vide, recherche large sans mot-clé.
- **Fenêtre temporelle (30j initial → incrémental) :** pour chaque source, si aucun `ingestion_runs` précédent n'est `success` ou `partial`, `maxDaysOld = 30` (30 derniers jours au setup/premier import). Sinon, `maxDaysOld` est calculé depuis le `finishedAt` du dernier run réussi de cette source (arrondi au jour supérieur, min `1`). France Travail mappe `maxDaysOld` sur le palier officiel supérieur (`1 | 3 | 7 | 14 | 31` via `publieeDepuis`) ; Adzuna passe `max_days_old` tel quel.
- **Orchestration & verrouillage :** `runIngestionSync({ sources?, trigger })` refuse un nouveau run simultané si une ligne `ingestion_runs` est déjà `running` depuis moins de 15 minutes. Chaque source configurée crée sa ligne `ingestion_runs` (`running` → `success` | `partial` | `error`) avec compteurs `fetchedCount`, `insertedCount`, `updatedCount`, `dedupedCount`.
- **Service cron séparé (Docker) :**
  - Endpoint `POST /api/ingestion/cron` protégé par `Authorization: Bearer <CRON_SECRET>` (comparaison constante via `crypto.timingSafeEqual`). Il lit `getDecryptedCredential<IngestionCronConfig>("ingestion_cron")` et déclenche `runIngestionSync({ trigger: "cron" })` uniquement si `enabled === true` et que le dernier run terminé remonte à plus de `intervalHours`.
  - Service `cron` dédié dans `docker-compose.yml` (`alpine:3.21` + `curl` + `crond -f -l 2`) qui exécute toutes les 15 minutes `curl -sf -X POST -H "Authorization: Bearer $CRON_SECRET" http://app:3000/api/ingestion/cron`, avec `depends_on: app (service_healthy)`.
- **dependenciesChanged:** no (`fetch` natif Node 22 + `node:crypto`).

## Structure

| Path | Purpose |
|------|---------|
| `src/lib/ingestion/search-query.ts` | Construction des critères de recherche depuis le profil local |
| `src/lib/ingestion/clients/france-travail.ts` | Auth OAuth2 + recherche + mapping offres France Travail |
| `src/lib/ingestion/clients/adzuna.ts` | Recherche + mapping offres Adzuna FR |
| `src/lib/ingestion/sync.ts` | Orchestrateur `runIngestionSync` + lecture historique `listRecentIngestionRuns` |
| `src/app/api/ingestion/cron/route.ts` | Route `POST /api/ingestion/cron` authentifiée par `CRON_SECRET` |
| `docker-compose.yml` | Service `cron` séparé + variables `APP_ENCRYPTION_KEY` / `CRON_SECRET` |
| `.env.example` | Ajout de `CRON_SECRET` |

## Contract

**`src/lib/ingestion/search-query.ts`** :

```typescript
export type IngestionSearchQuery = {
  keywords: string;
  maxDaysOld?: number;
};

export async function buildSearchQueryFromProfile(options?: {
  maxDaysOld?: number;
}): Promise<IngestionSearchQuery>;
```

**`src/lib/ingestion/clients/france-travail.ts`** :

```typescript
export async function fetchFranceTravailOffers(
  creds: { clientId: string; clientSecret: string },
  query: IngestionSearchQuery,
  fetchImpl?: typeof fetch,
): Promise<NormalizedOfferInput[]>;
```

**`src/lib/ingestion/clients/adzuna.ts`** :

```typescript
export async function fetchAdzunaOffers(
  creds: { appId: string; appKey: string },
  query: IngestionSearchQuery,
  fetchImpl?: typeof fetch,
): Promise<NormalizedOfferInput[]>;
```

**`src/lib/ingestion/sync.ts`** :

```typescript
export type IngestionRunSummary = {
  id: number;
  source: "france_travail" | "adzuna";
  status: "running" | "success" | "partial" | "error";
  fetchedCount: number;
  insertedCount: number;
  updatedCount: number;
  dedupedCount: number;
  errorMessage: string | null;
  startedAt: Date;
  finishedAt: Date | null;
};

export async function runIngestionSync(options?: {
  sources?: ("france_travail" | "adzuna")[];
  trigger?: "manual" | "cron";
}): Promise<{ runs: IngestionRunSummary[]; skippedReason?: string }>;

export async function listRecentIngestionRuns(
  limit?: number,
): Promise<IngestionRunSummary[]>;
```

**`src/app/api/ingestion/cron/route.ts`** :

```typescript
// POST /api/ingestion/cron
// Header: Authorization: Bearer <CRON_SECRET>
// 401 si secret manquant/invalide ; 200 { executed: boolean, reason?: string, runs?: IngestionRunSummary[] }
export async function POST(request: Request): Promise<Response>;
```

**`.env.example`** (ajout) :

```env
CRON_SECRET=replace-with-random-cron-secret
```

## Todos

- [x] Test: `src/lib/ingestion/search-query.test.ts` — `buildSearchQueryFromProfile()` extrait des mots-clés larges depuis `profiles` + `profile_skills` sans filtre géo/contrat, gère un profil vide, et propage `maxDaysOld` (doit échouer tant que `search-query.ts` n'est pas implémenté)
- [x] Add `src/lib/ingestion/search-query.ts` implementing `buildSearchQueryFromProfile` per Contract
- [x] Test: `src/lib/ingestion/clients/france-travail.test.ts` — `fetchFranceTravailOffers()` effectue l'auth OAuth2 `client_credentials` (`realm=%2Fpartenaire`, scope `api_offresdemploiv2 o2dsoffre`), mappe `maxDaysOld` au palier supérieur (`1 | 3 | 7 | 14 | 31` via `publieeDepuis`), envoie `range=0-49`, gère 204/vide, et normalise vers `NormalizedOfferInput[]` (doit échouer tant que `france-travail.ts` n'est pas implémenté)
- [x] Add `src/lib/ingestion/clients/france-travail.ts` implementing `fetchFranceTravailOffers` per Decisions and Contract
- [x] Test: `src/lib/ingestion/clients/adzuna.test.ts` — `fetchAdzunaOffers()` appelle `GET https://api.adzuna.com/v1/api/jobs/fr/search/1` avec `app_id`, `app_key`, `results_per_page=50`, `max_days_old`, `what`, et normalise vers `NormalizedOfferInput[]` (doit échouer tant que `adzuna.ts` n'est pas implémenté)
- [x] Add `src/lib/ingestion/clients/adzuna.ts` implementing `fetchAdzunaOffers` per Decisions and Contract
- [x] Test: `src/lib/ingestion/sync.test.ts` — `runIngestionSync()` refuse un run simultané si un `running` < 15 min existe (`skippedReason`), calcule `maxDaysOld` (30j initial sinon depuis le dernier `finishedAt` `success`/`partial`, min 1), enregistre les `ingestion_runs` (`running` → `success` | `partial` | `error`) avec compteurs, et `listRecentIngestionRuns()` retourne l'historique (doit échouer tant que `sync.ts` n'est pas implémenté)
- [x] Add `src/lib/ingestion/sync.ts` implementing `runIngestionSync` and `listRecentIngestionRuns` per Decisions and Contract
- [x] Test: `src/app/api/ingestion/cron/route.test.ts` — `POST /api/ingestion/cron` renvoie 401 si `Authorization: Bearer <CRON_SECRET>` absent/invalide (`timingSafeEqual`), 200 `{ executed: false }` si `ingestion_cron` désactivé ou `intervalHours` non écoulé, et 200 `{ executed: true, runs }` sinon (doit échouer tant que `route.ts` n'est pas implémenté)
- [x] Add `src/app/api/ingestion/cron/route.ts` implementing `POST` per Decisions and Contract
- [x] Update `.env.example` to add `CRON_SECRET=replace-with-random-cron-secret` per Contract
- [x] Update `docker-compose.yml` to pass `APP_ENCRYPTION_KEY` / `CRON_SECRET` to `app` and add the `cron` service (`alpine:3.21`, `curl`, `crond -f -l 2`, every 15 min, `depends_on: app` `service_healthy`)
- [x] Test: `npm test`, `npx tsc --noEmit`, and `npm run build` pass

## UAT

- [x] (auto) `npm test` passe les suites `src/lib/ingestion/**/*.test.ts` et `src/app/api/ingestion/cron/route.test.ts` (recherche profil, clients France Travail & Adzuna, verrouillage/fenêtre 30j→incrémentale de `runIngestionSync`, et auth/intervalle de `POST /api/ingestion/cron`)
- [x] (auto) `POST /api/ingestion/cron` rejette (`401`) un secret absent ou invalide via `crypto.timingSafeEqual` sans déclencher de sync
- [x] (auto) `.env.example` définit `CRON_SECRET` et `docker-compose.yml` inclut le service `cron` (`alpine:3.21`, `crond -f -l 2`, 15 min, `depends_on: app` `service_healthy`) ainsi que `APP_ENCRYPTION_KEY` et `CRON_SECRET`
- [x] (auto) `npx tsc --noEmit` et `npm run build` passent sans erreur avec tous les modules et la route cron en place
