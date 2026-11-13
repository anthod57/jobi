---
status: draft
---
# Jobi

Agrégateur d’offres d’emploi en local (Docker), pour chercheurs d’emploi — pas un SaaS.

## Vision

- **Qui :** personnes en recherche d’emploi (hors public « dev »).
- **Problème :** éviter de parcourir de nombreux sites pendant des heures chaque jour.
- **Solution :** une seule interface qui agrège des sources (API officielles), dédoublonne les offres, score par rapport au profil, et aide à rédiger des candidatures adaptées (LLM avec clé fournie par l’utilisateur).
- **Modèle :** projet personnel open source, instance locale par utilisateur (`docker compose`), sans compte ni inscription.
- **Succès (sans échéance) :** enchaînement observable ingestion → liste scorée → brouillon de candidature validé manuellement, sur France Travail + Adzuna.

## MVP

**User story**

- En tant que personne au chômage, je veux chercher les offres sur une même plateforme afin de gagner du temps et d’éviter d’utiliser de multiples sites.

**Capacités MVP**

- Sources : **France Travail**, **Adzuna** (API officielles).
- Profil : CV avec vérification ATS, compétences / mots-clés, expériences, lieu, salaire, télétravail, types de contrat, etc.
- Pas de compte : l’utilisateur lance Docker, renseigne ses infos et ses clés (LLM) dans l’instance.
- Scoring des offres vs profil ; génération de candidature (pas d’envoi automatique au MVP).

## Out of scope (MVP)

- Comptes utilisateurs, inscription, multi-tenant public.
- Application mobile, paiement, modèle SaaS / commercial.
- Envoi automatique des candidatures (à réévaluer plus tard).
- LinkedIn / Indeed (faisabilité juridique et technique à trancher).
- Hébergement centralisé ou exposition des données utilisateur en ligne.

## Stack

| Couche | Choix |
|--------|--------|
| App | Next.js (App Router), TypeScript, npm |
| UI | Tailwind CSS + **Flowbite React** (pas shadcn) |
| Icônes | `@heroicons/react` |
| Données | SQL (base dans Docker) |
| LLM | API au choix de l’utilisateur (Mistral, OpenAI, Claude) — clé en paramètres locaux |
| Sources offres | API officielles (France Travail, Adzuna) |
| Déploiement | Docker / Docker Compose — Windows, Linux, macOS |
| Repo | Greenfield, application unique |

## Codebase layout

- **Repo type :** application Next.js unique (pas monorepo).
- **Structure :** couches — `src/app/` (routes), `src/components/` (UI + wrappers DS), `src/lib/` (domaine, clients API), `src/server/` ou équivalent (accès DB, jobs).
- **Tests :** colocalisés — `*.test.ts` / `*.test.tsx` à côté du code.
- **Naming :** dossiers `kebab-case`, composants React `PascalCase`, alias d’import `@/` → `src/`.
- **Règle :** une entrée claire par feature côté routes ; pas de `utils/` fourre-tout.

## Design system

- **Composants :** `flowbite-react` ; primitives projet documentées dans `src/components/ui/` (wrappers minces).
- **Tokens / thème :** `tailwind.config` + theme Flowbite (`createTheme`) ; couleurs sémantiques uniquement en feature code.
- **Typographie & espacement :** échelle Tailwind documentée dans `docs/design-system.md` (à créer en M2).
- **Icônes :** Heroicons exclusivement.
- **Référence :** pas de Figma au départ — `docs/design-system.md` fait foi.
- **Règle :** **frontend n’utilise que le DS — pas de styles ad hoc dans le code métier.**
- **Ordre :** jalon **M2** (design system) avant écrans métier.

## Constraints (security, privacy, compliance)

- Données (profil, CV, offres importées, brouillons) **uniquement sur la machine / volumes Docker** de l’utilisateur.
- Pas d’objectif lucratif ; pas de publication des données utilisateur.
- Clés API LLM et credentials sources : stockage local à l’instance (détail chiffrement / fichiers env à figer en phase ops).
- Respect des conditions d’usage des API France Travail et Adzuna (quotas, pas de revente).
- Pas de contrainte de délai ou de planning imposé par le projet.

## Milestones

| # | ID | Title | Status |
|---|-----|-------|--------|
| 1 | M1 | `docker compose up` → app Next + SQL healthy, écran d’accueil | todo |
| 2 | M2 | Tokens Flowbite + primitives UI documentées (Button, Input, Card, Alert) | todo |
| 3 | M3 | Profil local : CV + compétences + préférences, persistance SQL | todo |
| 4 | M4 | France Travail + Adzuna : import offres + dédoublonnage | todo |
| 5 | M5 | Liste offres filtrée + score vs profil par offre | todo |
| 6 | M6 | Brouillon candidature LLM (clé user, validation manuelle) | todo |

## Open questions

- LinkedIn / Indeed : faisable légalement et techniquement ?
- Envoi automatique des candidatures : souhaité plus tard, sous quelles gardes ?
- Schéma exact de stockage des secrets (env, volume chiffré, autre) dans l’image Docker.
