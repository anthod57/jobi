---
id: M4-04
phase: 4
role: web
status: doing
branch: feat/m4-04-parametres-ingestion-ui
needs: [M4-03]
---
# Page /parametres (clés API + cron + sync manuelle) & état /offres

## Decisions

- **Navigation :** ajout de `{ href: "/parametres", label: "Paramètres", icon: Cog6ToothIcon }` dans `NAV_ITEMS` de `src/components/layout/app-shell.tsx` (icône `@heroicons/react/24/outline`).
- **Page `/parametres` :**
  - Formulaire **France Travail** (`clientId`, `clientSecret`) et **Adzuna** (`appId`, `appKey`) : affiche uniquement le statut configuré + `keyHint` masqué, jamais les secrets existants.
  - Section **Synchronisation automatique (cron)** : interrupteur `enabled` + sélecteur `intervalHours` (`6`, `12`, `24` heures).
  - Bouton **« Importer maintenant »** déclenchant `runIngestionSync({ trigger: "manual" })` et rafraîchissant l'historique des `ingestion_runs` (source, badge statut, compteurs fetch/insert/update/dedup, date, erreur éventuelle).
- **Page `/offres` :** affiche le compteur d'offres actuellement en base (`job_offers`), un bouton **« Importer maintenant »** si au moins une source est configurée, ou un bandeau d'invitation pointant vers `/parametres` sinon (la liste filtrée et le scoring restent dans M5).
- **Design System :** utilisation exclusive des primitives `@/components/ui` (`Card`, `Button`, `Input`, `Label`, `Select`, `Checkbox`, `Badge`, `Alert`) — zéro style ad hoc dans le code métier.
- **dependenciesChanged:** no.

## Structure

| Path | Purpose |
|------|---------|
| `src/components/layout/app-shell.tsx` | Ajout lien `/parametres` dans `NAV_ITEMS` |
| `src/app/parametres/actions.ts` | Server Actions (`saveProviderCredentialsAction`, `saveCronConfigAction`, `triggerManualIngestionAction`) |
| `src/app/parametres/page.tsx` | Page serveur chargeant statuts masqués, config cron et runs récents |
| `src/components/settings/settings-panel.tsx` | Formulaire clés API, config cron, bouton import manuel, tableau runs |
| `src/app/offres/page.tsx` | Compteur d'offres importées + bouton import / lien `/parametres` |

## Contract

**`src/app/parametres/actions.ts`** :

```typescript
export type SettingsActionState = {
  ok: boolean;
  message: string;
};

export async function saveProviderCredentialsAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState>;

export async function saveCronConfigAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState>;

export async function triggerManualIngestionAction(): Promise<SettingsActionState>;
```

## Todos

- [x] Test: `src/app/parametres/actions.test.ts` — spec `saveProviderCredentialsAction` (validation, France Travail & Adzuna save, error handling), `saveCronConfigAction` (`enabled` + `intervalHours` 6/12/24), and `triggerManualIngestionAction` (`runIngestionSync({ trigger: "manual" })`, `already_running`, empty sources, success) (fails until `actions.ts` implemented)
- [x] Add `src/app/parametres/actions.ts` — implement `saveProviderCredentialsAction`, `saveCronConfigAction`, and `triggerManualIngestionAction` per Contract with `revalidatePath("/parametres")` and `revalidatePath("/offres")`
- [x] Update `src/components/layout/app-shell.tsx` — add `{ href: "/parametres", label: "Paramètres", icon: Cog6ToothIcon }` (`@heroicons/react/24/outline`) to `NAV_ITEMS`
- [x] Add `src/components/settings/settings-panel.tsx` — client UI using `@/components/ui` primitives only (`Card`, `Button`, `Input`, `Label`, `Select`, `Checkbox`, `Badge`, `Alert`): France Travail & Adzuna forms (configured status + masked `keyHint` only), cron toggle & `intervalHours` (`6`/`12`/`24`), « Importer maintenant » button, and `ingestion_runs` history table
- [ ] Add `src/app/parametres/page.tsx` — Server Component loading `listCredentialStatuses()`, `IngestionCronConfig`, and `listRecentIngestionRuns(20)`, rendering `SettingsPanel` with title `Paramètres — Jobi`
- [ ] Update `src/app/offres/page.tsx` — display `job_offers` count, « Importer maintenant » action when at least one source is configured, or invitation banner linking to `/parametres` otherwise
- [ ] Test: `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npm test` pass

## UAT

- [ ] (auto) `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npm test` exit 0
- [ ] (auto) GET `/parametres` and `/offres` return HTTP 200 with `<html lang="fr">`, expected page titles, and no decrypted secrets in HTML
- [ ] (auto) Sidebar navigation includes `/parametres` (« Paramètres ») and links cleanly without 404
- [ ] (human) Keyboard & contrast (shared-audit §4): Tab through `/parametres` and `/offres` controls with visible focus; OS light/dark text and controls remain readable
- [ ] (human) DS only (shared-design-system): `src/components/settings/*`, `src/app/parametres/*`, and `src/app/offres/*` import UI exclusively from `@/components/ui` (no `flowbite-react` or ad hoc styles)
- [ ] (human) Functional check: saving France Travail/Adzuna keys shows masked `keyHint` without exposing secrets, cron toggle/interval persists, « Importer maintenant » updates `ingestion_runs` table, and `/offres` reflects offer count + configured-source state
