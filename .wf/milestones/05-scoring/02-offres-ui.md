---
id: M5-02
phase: 2
role: web
status: done
branch: feat/m5-02-offres-ui
needs: [M5-01, M2-03]
---
# UI `/offres` (liste filtrable + tri + score) et `/offres/[id]` (détail + explication)

## Decisions

- **Design system strict :** uniquement les primitives `@/components/ui` (`Alert`, `Badge`, `Button`, `Card`, `Input`, `Label`, `Select`) et icônes `@heroicons/react/24/outline` ; aucun `#hex` ni style ad hoc.
- **Filtres pilotés par l'URL (`searchParams`) :** `q` (titre, entreprise, description), `contractType`, `remoteMode`, `source`, `minScore` (palier `0`, `50`, `75`), `sort` (`score` par défaut ou `date`), `page`. Soumission via formulaire GET ou navigation `router.push` pour garder des URLs partageables et SSR-compatibles.
- **Bandeau profil vide :** si `isEmptyProfile` est vrai (ou aucune offre scorée alors que le profil est vide), afficher `Alert variant="info"` avec bouton/lien vers `/profil`.
- **Affichage du score sur la liste :** `Badge` coloré selon le palier (`score >= 75` → `success`, `score >= 50` → `warning`, `score < 50` → `gray`, `score === null` → `info` « Profil requis »).
- **Page détail `/offres/[id]` :** affiche les métadonnées de l'offre, la description complète, les liens externes vers chaque source (`target="_blank" rel="noopener noreferrer"`), et une carte d'explication du score (compétences matchées / manquantes + statut de chaque critère du `ScoreBreakdown`). `notFound()` si l'offre n'existe pas.
- **Accessibilité (WCAG) :** chaque filtre possède un `<Label htmlFor="...">` explicite, navigation clavier complète sur les filtres, liens d'offres et pagination.
- **Hors scope :** aucun bouton/formulaire de génération de candidature LLM (réservé à M6).
- **dependenciesChanged:** no.

## Structure

| Path | Purpose |
|------|---------|
| `src/app/offres/page.tsx` | Server Component lisant `searchParams`, appelant `listScoredOffers` + `listCredentialStatuses` |
| `src/app/offres/[id]/page.tsx` | Server Component détail d'une offre + `ScoreBreakdown` |
| `src/components/offers/offer-filters-bar.tsx` | Barre de filtres et tri (`Input`, `Select`, `Label`, `Button`) |
| `src/components/offers/offer-card.tsx` | Carte offre dans la liste (titre, entreprise, lieu, badges contrat/télétravail/source, `ScoreBadge`) |
| `src/components/offers/score-badge.tsx` | Composant `ScoreBadge` (palier couleur + libellé accessible) |
| `src/components/offers/score-breakdown-card.tsx` | Détail des critères et compétences matchées/manquantes pour `/offres/[id]` |
| `src/components/offers/labels.ts` | Libellés français centralisés (contrats, télétravail, sources, critères) |

## Contract

**Composants DS autorisés (`@/components/ui`) :**
`Alert`, `Badge`, `Button`, `Card`, `Input`, `Label`, `Select`.

**Mapping `ScoreBadge` :**

```typescript
export function getScoreBadgeProps(score: number | null): {
  color: "success" | "warning" | "gray" | "info";
  label: string;
} {
  if (score === null) return { color: "info", label: "Profil requis" };
  if (score >= 75) return { color: "success", label: `${score} %` };
  if (score >= 50) return { color: "warning", label: `${score} %` };
  return { color: "gray", label: `${score} %` };
}
```

**Routes :**
- `GET /offres?q=...&contractType=...&remoteMode=...&source=...&minScore=...&sort=score|date&page=1`
- `GET /offres/[id]` (retourne `404` via `notFound()` si `id` invalide ou inexistant)

## Todos

- [x] Add `src/components/offers/labels.ts` — centralized French labels for contract types, remote modes, sources, and score criteria
- [x] Test: `src/components/offers/score-badge.test.ts` — spec `getScoreBadgeProps(score)` thresholds (`>=75` `success`, `>=50` `warning`, `<50` `gray`, `null` `info` « Profil requis ») (fails until `score-badge.tsx` implemented)
- [x] Add `src/components/offers/score-badge.tsx` — implement `getScoreBadgeProps` and `ScoreBadge` using `@/components/ui` `Badge`
- [x] Add `src/components/offers/offer-filters-bar.tsx` — implement URL-driven GET filter & sort form (`q`, `contractType`, `remoteMode`, `source`, `minScore`, `sort`) with explicit `<Label htmlFor>` and `@/components/ui` `Input`, `Select`, `Button`
- [x] Add `src/components/offers/offer-card.tsx` — implement offer list card using `@/components/ui` `Card`, `Badge`, `Button`, and `ScoreBadge`
- [x] Add `src/components/offers/score-breakdown-card.tsx` — implement `ScoreBreakdown` detail card (matched/missing skills + criterion statuses) using `@/components/ui` `Card`, `Badge`
- [x] Update `src/app/offres/page.tsx` — read `searchParams`, validate via `offerFiltersSchema`, call `listScoredOffers` + `listCredentialStatuses`, render empty-profile `Alert` banner linking to `/profil`, `OfferFiltersBar`, `OfferCard` list, and pagination
- [x] Add `src/app/offres/[id]/page.tsx` — Server Component calling `getScoredOfferById(id)` with `notFound()` on invalid/missing `id`, rendering metadata, full description, external source links (`target="_blank" rel="noopener noreferrer"`), and `ScoreBreakdownCard`
- [x] Test: `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npm test` pass
- [x] fix: mark `src/components/offers/offer-filters-bar.tsx` `"use client"` so `icon={MagnifyingGlassIcon}` does not throw RSC serialization 500 on `/offres`

## UAT

- [x] (auto) `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npm test` exit 0
- [x] (auto) GET `/offres` returns HTTP 200 with `<html lang="fr">`, title `Offres — Jobi`, and filter/sort controls
- [x] (auto) GET `/offres/999999` (non-existent) returns HTTP 404
- [x] (human) Keyboard & contrast (shared-audit §4): Tab through `/offres` filters, offer cards, pagination, and `/offres/[id]` links with visible focus; OS light/dark text and score badges remain readable
- [x] (human) DS only (shared-design-system): `src/components/offers/*` and `src/app/offres/*` import UI exclusively from `@/components/ui` (no `flowbite-react`, no `#hex`, no ad hoc styles)
- [x] (human) Functional check: filtering/sorting updates URL `searchParams` and results, empty profile shows `info` `Alert` linking to `/profil`, and `/offres/[id]` displays score breakdown and external source links
