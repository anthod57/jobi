---
id: M7-01
phase: 1
role: api
status: discuss
branch: feat/m7-01-cv-structured-parsing
needs: [M3-02]
---
# Extraction structurée du CV multi-formats (coordonnées PDF + heuristiques)

## Decisions

- **100 % déterministe (sans LLM)** : aucun appel API externe, latence nulle, testable hors ligne sur fixtures PDF/DOCX.
- **Extraction PDF par coordonnées `(x, y)`** via `pdfjs-dist` (`page.getTextContent()`):
  - Détecte automatiquement les mises en page **2 colonnes** (gouttière verticale dans la zone 28 %–52 % de la largeur de page avec du texte des deux côtés) et lit **colonne gauche de haut en bas, puis colonne droite de haut en bas** (et **1 colonne** de haut en bas sinon).
  - Regroupe les fragments sur la même ligne horizontale (`y` tolérance ~3 pt, triés par `x` croissant) pour éviter les coupures de phrases ou colonnes internes décalées.
- **Nettoyage du texte extrait** : suppression des caractères d'icônes PUA (`\uE000-\uF8FF`) devant les coordonnées/liens.
- **Découpage par sections (`extractCvSections`)** :
  - **En-têtes reconnus** :
    - `experiences` : `Expériences`, `Expériences professionnelles`, `Parcours professionnel`, `Work experience`, `Emplois`
    - `skills` : `Compétences`, `Compétences techniques`, `Stack technique`, `Technologies`, `Outils`, `Savoir-faire`, `Skills`, `Technical skills`
    - `softSkills` : `Soft-skills`, `Atouts`, `Qualités`, `Savoir-être`
    - `education` : `Diplômes et Formations`, `Formations`, `Diplômes`, `Formation`, `Éducation`, `Études`, `Certifications`
    - `contact` : `Contact`, `Coordonnées`, `Informations personnelles`
    - `other` : `Langues`, `Centres d'intérêt`, `Projets`, `Profil`, `À propos`, `Résumé`
  - **Filtrage strict des titres & sous-titres** : aucun titre de section ni sous-titre interne (`Front-End`, `Back-End`, `Base de données`, `Autres`, `Mobile`, `DevOps`, `Cloud`, `Frameworks`, `Langages`) ne doit apparaître dans les items extraits.
  - **Détection heuristique des compétences** :
    - Dans `skills` : les listes courtes séparées par `,` / `•` / `|` sont découpées en tokens ; les phrases descriptives longues restent entières.
    - Hors `experiences` et `education` : les listes techniques (mots-clés tech connus / listes courtes séparées par `,`/`•`/`|` sans structure de phrase narrative) sont classées automatiquement dans `skills`.
  - **Contact** : extraction des emails, téléphones, URLs `https?://...` et domaines profils sans protocole (`github.com/...`, `linkedin.com/in/...`, `gitlab.com/...`).
- **dependenciesChanged** : `no` (`pdfjs-dist` déjà présent via `pdf-parse` et externalisé dans `next.config.ts`).

## Structure

| Path | Purpose |
|------|---------|
| `src/lib/profile/cv-parse.ts` | Extraction PDF ordonnée par coordonnées `(x, y)` (1 et 2 colonnes) |
| `src/lib/profile/cv-sections.ts` | Classification en sections, filtrage sous-titres, heuristique compétences & contact |
| `src/lib/profile/cv-sections.test.ts` | Tests unitaires et sur fixtures PDF (1 colonne, 2 colonnes désordonné, sparse) |
| `src/test/fixtures/cv/cv-two-column-backend.pdf` | Fixture PDF 2 colonnes anonymisée (flux désordonné) |

## Contract

**Types (`src/lib/profile/cv-sections.ts`) :**

```typescript
export type CvSectionKey =
  | "contact"
  | "experiences"
  | "skills"
  | "softSkills"
  | "education"
  | "other";

export type CvExtractedSections = Record<CvSectionKey, string[]>;

export function extractCvSections(text: string): CvExtractedSections;
```

**Comportement attendu sur `src/test/fixtures/cv/cv-two-column-backend.pdf` :**
- `contact` contient email, téléphone, `github.com/...` et `linkedin.com/in/...`.
- `experiences` contient le poste, l'entreprise et les 3 puces d'expérience (absentes de `skills`).
- `skills` contient les compétences métier + la stack (`Python`, `FastAPI`, `Go`, `gRPC`, `PostgreSQL`, `Redis`, `Elasticsearch`, `Docker`, `Kubernetes`, `Git`), sans sous-titres (`Back-End`, `Base de données`, `Autres`, `Stack technique`).
- `softSkills` contient `Rigueur`, `Autonomie`, `Esprit d equipe`.
- `education` contient le diplôme (`Master Ingenierie Logicielle...`).

## Todos

_(À planifier via `/wf-plan-phase M7-01`)_

## UAT

_(À planifier via `/wf-plan-phase M7-01`)_
