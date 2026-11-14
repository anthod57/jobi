---
id: M6-02
phase: 2
role: web
status: review
branch: feat/m6-02-candidatures-ui
needs: [M6-01, M5-02]
---
# UI Paramètres LLM, génération sur `/offres/[id]` et suivi + graphiques sur `/candidatures`

## Decisions

- **Design system strict :** uniquement les primitives `@/components/ui` (`Alert`, `Badge`, `Button`, `Card`, `Input`, `Label`, `Select`) et icônes `@heroicons/react/24/outline` ; aucun `#hex`, aucune lib de graphiques tierce, aucun style ad hoc.
- **Configuration LLM dans `/parametres` :** section dédiée « Fournisseur LLM » dans `SettingsPanel` permettant d'enregistrer/remplacer la clé API chiffrée pour Mistral, OpenAI ou Anthropic (affichage `keyHint` masqué) et de choisir le fournisseur actif + modèle (avec suggestion du modèle par défaut).
- **Génération & édition sur `/offres/[id]` :**
  - Panneau « Préparer ma candidature » : rappel de confidentialité visible (`Alert variant="info"` précisant que profil utile sans coordonnées + offre sont envoyés au fournisseur configuré ; ou lien vers `/parametres` si aucune clé configurée).
  - Sélecteur de ton (`Professionnel`, `Direct`, `Enthousiaste`) + champ optionnel `Consigne particulière` + bouton « Générer le brouillon » (état loading clair).
  - Éditeur inline (`Objet` + `Message`) avec sauvegarde manuelle, bouton « Copier » (feedback « Copié ! »), bouton « Régénérer » (avec confirmation si modifié localement), sélecteur de statut (`draft` → `validated` → `sent` / `archived`), et lien direct vers `/candidatures`.
- **Page `/candidatures` (vue unifiée stats + suivi) :**
  - **En haut :** 4 cartes KPI (`Total`, `En préparation`, `Envoyées`, `Coût LLM estimé`) + **2 graphiques SVG/Tailwind natifs** utilisant exclusivement les tokens sémantiques du DS (`primary`, `success`, `warning`, `secondary`) :
    1. Répartition des candidatures par statut (barres horizontales proportionnelles accessibles avec valeurs chiffrées).
    2. Consommation tokens & coût LLM par fournisseur (prompt vs complétion + coût USD).
  - **En dessous :** filtres par statut (`Toutes`, `Brouillons`, `Validées`, `Envoyées`, `Archivées`) + recherche texte, puis cartes de candidatures avec aperçu, édition rapide du brouillon/notes, copie en 1 clic, changement de statut et lien vers `/offres/[id]`.
- **Accessibilité (WCAG) :** `<Label htmlFor>` explicites, zones `aria-live="polite"` pour les retours « Copié ! » / « Brouillon enregistré », attributs `role="img"` + `aria-label` sur les graphiques SVG.
- **dependenciesChanged:** no.

## Structure

| Path | Purpose |
|------|---------|
| `src/app/parametres/actions.ts` | Server Actions `saveLlmKeyAction`, `saveLlmConfigAction` |
| `src/app/parametres/page.tsx` | Lecture statuts LLM (`llm_mistral`, `llm_openai`, `llm_anthropic`, `llm_config`) |
| `src/components/settings/settings-panel.tsx` | Ajout section configuration LLM (clés + fournisseur actif + modèle) |
| `src/app/candidatures/actions.ts` | Server Actions `generateDraftAction`, `updateApplicationAction` |
| `src/components/candidatures/labels.ts` | Libellés français centralisés (statuts, tons, fournisseurs LLM) |
| `src/components/candidatures/offer-application-panel.tsx` | Panneau génération + édition + copie + statut sur `/offres/[id]` |
| `src/app/offres/[id]/page.tsx` | Intégration de `OfferApplicationPanel` |
| `src/components/candidatures/candidature-stats-charts.tsx` | 4 KPIs + 2 graphiques SVG/Tailwind DS (statuts + coût/tokens LLM) |
| `src/components/candidatures/application-card.tsx` | Carte candidature éditable avec copie 1 clic et changement de statut |
| `src/app/candidatures/page.tsx` | Remplacement du placeholder par la vue stats + filtres + liste |

## Contract

**Composants DS autorisés (`@/components/ui`) :**
`Alert`, `Badge`, `Button`, `Card`, `Input`, `Label`, `Select`.

**Actions serveur (`src/app/candidatures/actions.ts`) :**

```typescript
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function generateDraftAction(input: {
  offerId: number;
  tone: "professional" | "direct" | "enthusiastic";
  customInstructions: string;
}): Promise<ActionResult<{ applicationId: number }>>;

export async function updateApplicationAction(input: {
  applicationId: number;
  status?: "draft" | "validated" | "sent" | "archived";
  draftSubject?: string;
  draftBody?: string;
  notes?: string;
}): Promise<ActionResult>;
```

## Todos

- [x] Add `src/components/candidatures/labels.ts` — centralized French labels & badge colors for `ApplicationStatus`, `ApplicationTone`, and `LlmProvider`
- [x] Test: `src/app/parametres/actions.test.ts` — extend specs for `saveLlmKeyAction` and `saveLlmConfigAction` (validation, encrypted storage, no key echo) (fails until actions implemented)
- [x] Update `src/app/parametres/actions.ts` and `src/app/parametres/page.tsx` — add `saveLlmKeyAction`, `saveLlmConfigAction`, and pass LLM statuses/config to `SettingsPanel`
- [x] Update `src/components/settings/settings-panel.tsx` — add « Fournisseur LLM » section (API keys with `keyHint`, active provider + model selector) using `@/components/ui`
- [x] Test: `src/app/candidatures/actions.test.ts` — spec `generateDraftAction` (missing config error, LLM call + DB save) and `updateApplicationAction` (Zod validation + status/draft/notes update) (fails until `actions.ts` implemented)
- [x] Add `src/app/candidatures/actions.ts` — implement `generateDraftAction` and `updateApplicationAction` with `revalidatePath`
- [x] Test: `src/components/candidatures/offer-application-panel.test.tsx` — spec tone/instruction form, privacy notice, inline editor, copy feedback, and regenerate confirmation when edited (fails until component implemented)
- [x] Add `src/components/candidatures/offer-application-panel.tsx` and integrate into `src/app/offres/[id]/page.tsx` — DS-only generation & inline editing panel
- [x] Test: `src/components/candidatures/candidature-stats-charts.test.tsx` — spec KPI cards and accessible SVG/Tailwind charts (`role="img"`, `aria-label`, status counts, token/cost totals) (fails until component implemented)
- [x] Add `src/components/candidatures/candidature-stats-charts.tsx` — implement 4 KPI cards and 2 DS-token SVG/Tailwind charts
- [x] Add `src/components/candidatures/application-card.tsx` and update `src/app/candidatures/page.tsx` — replace placeholder with stats charts, status/search filters, and editable application cards
- [x] Test: `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npm test` pass
- [x] fix: surface LLM API error details and omit unsupported temperature on OpenAI models
- [x] fix: retry OpenAI-compatible calls without temperature when HTTP 400 rejects temperature
- [x] fix: append profile fullName signature locally after LLM draft generation and place OfferApplicationPanel below ScoreBreakdownCard on lg screens
- [x] fix: stack Ton and Consigne particulière full-width in OfferApplicationPanel for narrow sidebar column

## UAT

- [x] (auto) `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npm test` exit 0
- [x] (auto) GET `/candidatures` and GET `/parametres` return HTTP 200 with `<html lang="fr">` and expected headings
- [x] (human) Keyboard & contrast (shared-audit §4): Tab through `/parametres` LLM config, `/offres/[id]` application panel, and `/candidatures` filters/cards with visible focus; charts and badges remain readable in light/dark mode
- [x] (human) DS only (shared-design-system): `src/components/candidatures/*`, `src/app/candidatures/*`, and updated `settings-panel.tsx` import UI exclusively from `@/components/ui` (no raw `#hex`, no charting lib, no ad hoc styles)
- [ ] (human) End-to-end UX check: configure LLM key in `/parametres`, generate & edit draft on `/offres/[id]` (with privacy notice and 1-click copy), and verify `/candidatures` updates KPIs, charts, status, and token/cost stats
