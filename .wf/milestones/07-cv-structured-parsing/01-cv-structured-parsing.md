---
id: M7-01
phase: 1
role: api
status: discuss
branch: milestone/07-cv-structured-parsing
needs: [M3-02]
---
# Extraction structurée hybride du CV, persistance & score ATS évolué

## Decisions

- **Pipeline en 4 étapes (inspiré des ATS modernes)** :
  1. **Extraction *Layout-Aware* (100 % déterministe)** via `pdfjs-dist` (`page.getTextContent()` sans worker bloquant côté Node/Next) pour les PDF et `mammoth` pour les DOCX :
     - Regroupe les fragments par ligne horizontale (`y` tolérance ~3 pt, triés par `x` croissant).
     - Détecte un éventuel **bandeau pleine largeur en haut** (lignes traversant la zone `[28 %–52 %]`), puis détecte une **gouttière verticale** sur le reste de la page dans `[28 %–52 %]` avec texte des deux côtés : lit d'abord le bandeau haut, puis **colonne gauche de haut en bas**, puis **colonne droite de haut en bas** (sinon 1 colonne de haut en bas), page par page.
     - Supprime les icônes PUA (`\uE000-\uF8FF`) et normalise les espaces/retours à la ligne.
     - Retourne aussi `layout: { isMultiColumn: boolean; pageCount: number }`.
  2. **Structuration sémantique hybride (LLM optionnel + fallback déterministe)** :
     - **Si une clé LLM utilisateur est configurée** (via la config LLM existante réutilisée par `src/lib/candidatures/llm-client.ts`) : appel LLM avec prompt système strict demandant un JSON conforme à `structuredCvSchema`, validé par Zod. En cas d'erreur réseau, timeout ou JSON invalide, fallback silencieux sur le parseur déterministe (jamais de blocage).
     - **Sans clé LLM (mode local 100 % fonctionnel)** : `extractCvSections` amélioré (en-têtes étendus dont `Diplômes et Formations`, filtrage strict des sous-titres y compris `Sous-titre : a, b`, séparation stricte `skills` / `softSkills` / `other` sans absorber `Langues` ni `Centres d'intérêt`, extraction best-effort des objets `experiences` et `education` avec fallback ligne brute).
  3. **Validation & normalisation déterministes** : validation Zod (`structuredCvSchema`), déduplication insensible à la casse des compétences (en conservant la casse d'origine), normalisation des URLs (`github.com/...`, `linkedin.com/in/...`).
  4. **Score ATS 100 % déterministe (`src/lib/profile/ats/`)** :
     - `AtsContext` accepte `structured?: StructuredCv` et `layout?: CvLayoutMeta` en champs optionnels (rétrocompatibilité des tests existants).
     - `structure` et `contact` s'appuient en priorité sur `structured` (évite les faux négatifs sur des titres créatifs parsés par le LLM).
     - `format` utilise `layout.isMultiColumn` (avertissement réel sur PDF multi-colonnes) au lieu de deviner uniquement via `\s{4,}`, et signale `pageCount > 2` (info/warning léger).
     - `dates` vérifie aussi la présence de dates sur `structured.experiences` quand peuplé.
- **Persistance (`profile_cv`)** : ajout de `structured_sections` (`jsonb`), `parse_mode` (`varchar(20)` : `"llm" | "deterministic"`), `is_multi_column` (`boolean`), `page_count` (`smallint`) via migration Drizzle. Analyse exécutée **à l'upload** (`uploadCv`) et à la demande via `reanalyzeCvWithAi()`, jamais à la lecture de `/profil`.
- **Auto-remplissage profil (serveur)** : nouvelle server action `applyStructuredCvToProfile()` qui fusionne de façon non destructive les champs vides ou demandés (identité, contact, compétences dédupliquées, expériences) et recalcule les scores des offres.
- **dependenciesChanged** : `no` (`pdfjs-dist` déjà présent via `pdf-parse` et externalisé dans `next.config.ts`).

## Structure

| Path | Purpose |
|------|---------|
| `src/server/db/schema.ts` | Ajout colonnes `structuredSections`, `parseMode`, `isMultiColumn`, `pageCount` sur `profileCv` |
| `drizzle/*` | Migration SQL générée pour `profile_cv` |
| `src/lib/profile/cv-parse.ts` | Extraction PDF par coordonnées `(x, y)` (`pdfjs-dist`) + `layout` (`isMultiColumn`, `pageCount`) + DOCX (`mammoth`) |
| `src/lib/profile/cv-sections.ts` | Schéma `StructuredCv` + Zod + parseur déterministe amélioré + point d'entrée hybride `parseCvStructured` |
| `src/lib/profile/cv-llm-parser.ts` | Appel LLM JSON strict pour structuration CV (réutilise la config LLM utilisateur) avec fallback |
| `src/lib/profile/ats/types.ts` | Ajout `structured?: StructuredCv` et `layout?: CvLayoutMeta` dans `AtsContext` |
| `src/lib/profile/ats/rules/*.ts` | Exploitation de `structured` et `layout` dans `contact`, `structure`, `format`, `dates` |
| `src/lib/profile/repository.ts` | `ProfileCvDto` enrichi + `upsertCvAfterParse` mis à jour + `reanalyzeCv` |
| `src/app/profil/actions.ts` | `uploadCv` hybride, `reanalyzeCvWithAi`, `applyStructuredCvToProfile` |
| `src/lib/profile/*.test.ts` | Tests unitaires et fixtures (1 col, 2 col bandeau, DOCX, LLM mock + fallback, ATS) |
| `src/test/fixtures/cv/cv-two-column-backend.pdf` | Fixture PDF 2 colonnes anonymisée |

## Contract

**Schéma Drizzle (`src/server/db/schema.ts` — table `profile_cv`) :**

```typescript
structuredSections: jsonb("structured_sections").$type<StructuredCv | null>().default(null),
parseMode: varchar("parse_mode", { length: 20 }).notNull().default("deterministic"),
isMultiColumn: boolean("is_multi_column").notNull().default(false),
pageCount: smallint("page_count").notNull().default(1),
```

**Types & Zod (`src/lib/profile/cv-sections.ts`) :**

```typescript
export type CvParseMode = "llm" | "deterministic";

export interface CvLayoutMeta {
  isMultiColumn: boolean;
  pageCount: number;
}

export interface CvStructuredExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  highlights: string[];
}

export interface CvStructuredEducation {
  degree: string;
  school: string;
  year: string;
}

export interface CvStructuredContact {
  fullName?: string;
  headline?: string;
  location?: string;
  emails: string[];
  phones: string[];
  urls: string[];
}

export interface StructuredCv {
  contact: CvStructuredContact;
  experiences: CvStructuredExperience[];
  education: CvStructuredEducation[];
  skills: string[];
  softSkills: string[];
  other: string[];
}

export interface StructuredParseOutput {
  structured: StructuredCv;
  mode: CvParseMode;
}

export function extractCvStructuredDeterministic(text: string): StructuredCv;
export async function parseCvStructured(text: string): Promise<StructuredParseOutput>;
```

**Extraction PDF/DOCX (`src/lib/profile/cv-parse.ts`) :**

```typescript
export type CvParseSuccess = {
  ok: true;
  text: string;
  mimeType: string;
  layout: CvLayoutMeta;
};
```

**ATS (`src/lib/profile/ats/types.ts`) :**

```typescript
export type AtsContext = {
  profileSkills: string[];
  profileEmail: string;
  profilePhone: string;
  structured?: StructuredCv;
  layout?: CvLayoutMeta;
};
```

**Server Actions (`src/app/profil/actions.ts`) :**

```typescript
export async function reanalyzeCvWithAi(): Promise<UploadCvResult>;
export async function applyStructuredCvToProfile(): Promise<SaveProfileResult>;
```

## Todos

_(À planifier via `/wf-plan-phase M7-01`)_

## UAT

_(À planifier via `/wf-plan-phase M7-01`)_
