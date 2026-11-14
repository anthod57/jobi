---
id: M7-01
phase: 1
role: api
status: doing
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

- [x] Add `structuredSections`, `parseMode`, `isMultiColumn`, and `pageCount` columns to `profileCv` in `src/server/db/schema.ts` matching Contract and generate Drizzle migration in `drizzle/`
- [x] Test: `src/lib/profile/cv-parse.test.ts` — verify layout-aware PDF extraction (top banner + left-then-right column order on `cv-two-column-backend.pdf`, PUA icon removal, `layout.isMultiColumn`, `layout.pageCount`) and DOCX layout metadata; must fail until implemented
- [x] Implement coordinate-based `pdfjs-dist` extraction (`y`-line grouping, top banner + vertical gutter detection, PUA strip) and `layout` metadata in `src/lib/profile/cv-parse.ts`
- [x] Test: `src/lib/profile/cv-sections.test.ts` — verify `structuredCvSchema` Zod validation, extended headers, subtitle filtering, strict `skills`/`softSkills`/`other` separation, URL normalization, case-insensitive skill dedup, and `parseCvStructured` LLM mock + silent fallback; must fail until implemented
- [x] Add `StructuredCv` types, `structuredCvSchema`, `extractCvStructuredDeterministic`, and `parseCvStructured` in `src/lib/profile/cv-sections.ts`
- [x] Create `src/lib/profile/cv-llm-parser.ts` reusing LLM config from `src/lib/candidatures/llm-client.ts` with strict JSON prompt, Zod validation, and silent fallback on error/timeout
- [x] Test: `src/lib/profile/ats/runAtsAnalysis.test.ts` — verify `AtsContext` accepts optional `structured`/`layout` and rules (`contact`, `structure`, `format`, `dates`) use `structured`, `layout.isMultiColumn`, and `pageCount > 2` with legacy backward compatibility; must fail until implemented
- [x] Update `AtsContext` in `src/lib/profile/ats/types.ts` and rules in `src/lib/profile/ats/rules/contact.ts`, `structure.ts`, `format.ts`, `dates.ts` (plus `src/lib/profile/ats/runAtsAnalysis.ts` wiring)
- [x] Test: `src/lib/profile/repository.test.ts` — verify `ProfileCvDto` and `upsertCvAfterParse` persist and return `structuredSections`, `parseMode`, `isMultiColumn`, and `pageCount`; must fail until implemented
- [x] Update `ProfileCvDto` and `upsertCvAfterParse` in `src/lib/profile/repository.ts` to persist and return structured CV and layout metadata
- [x] Test: `src/app/profil/actions.test.ts` — verify `uploadCv` hybrid parse, `reanalyzeCvWithAi`, and `applyStructuredCvToProfile` (non-destructive merge + offer rescoring); must fail until implemented
- [ ] Update `uploadCv` and implement `reanalyzeCvWithAi` and `applyStructuredCvToProfile` in `src/app/profil/actions.ts`

## UAT

- [ ] (auto) `npm test -- src/lib/profile src/app/profil/actions.test.ts` passes with all layout-aware PDF, structured parsing, LLM fallback, ATS, repository, and action tests green
- [ ] (auto) `npm run build` succeeds without TypeScript or Next.js bundling errors (including `pdfjs-dist` server externalization)
- [ ] (auto) Drizzle migration applies cleanly and `profile_cv` persists `structured_sections`, `parse_mode`, `is_multi_column`, and `page_count`
- [ ] (auto) Parsing `src/test/fixtures/cv/cv-two-column-backend.pdf` yields ordered text without column interleaving, `layout.isMultiColumn: true`, and valid `structuredSections`
