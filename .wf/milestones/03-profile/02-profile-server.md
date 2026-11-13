---
id: M3-02
phase: 2
role: api
status: done
branch: feat/m3-02-profile-server
needs: [M3-01]
---
# Profil : Server Actions, parse CV, moteur ATS

## Decisions

- **Server Actions + RSC** — no public REST for profile CRUD (except existing `/api/health`).
- **CV upload:** `multipart/form-data` via Server Action; accept **PDF** and **DOCX** only; **max 5 MiB**; parse in memory; **discard file buffer** after parse — persist **text + metadata** only (M3-01 `profile_cv`).
- **Parsers:** `pdf-parse` (PDF), `mammoth` (DOCX) — extract plain text only.
- **ATS:** rule engine **deterministic** (no LLM); **score 0–100** + **findings** list (French messages); ruleset **large** (style ATS recruteur) — see Contract.
- **Validation:** **Zod** at action boundary; reject unknown fields (`strict()` where applicable).
- **Replace semantics:** saving profile replaces skills/experiences in a transaction (delete children + insert); CV upload replaces `extracted_text` and re-runs ATS.
- **Errors:** user-safe French messages; no stack/SQL to client (shared-audit).
- **dependenciesChanged:** yes (`zod`, `pdf-parse`, `mammoth`, `@types/pdf-parse`, `vitest`).

## Structure

| Path | Purpose |
|------|---------|
| `src/lib/profile/schemas.ts` | Zod input/output types |
| `src/lib/profile/ats/` | Rules + scorer + types |
| `src/lib/profile/cv-parse.ts` | MIME detect + extract text |
| `src/lib/profile/repository.ts` | DB read/write profile id `1` |
| `src/app/profil/actions.ts` | Server Actions |
| `src/app/profil/page.tsx` | Server Component loader (data only; UI M3-03) |

## Contract

**Dependencies:**

```bash
npm install zod pdf-parse mammoth
npm install -D @types/pdf-parse
```

**Zod — `ProfileUpdateInput`** (strict object):

```typescript
{
  fullName: string.max(200),
  headline: string.max(300).optional().default(''),
  email: string.email().or(z.literal('')),
  phone: string.max(40),
  locationLabel: string.min(1).max(200),
  searchRadiusKm: number.int().min(0).max(500),
  remotePreference: z.enum(['onsite','hybrid','remote','flexible']),
  minSalaryAnnualGross: number.int().positive().nullable(),
  contractTypes: z.array(z.enum(['cdi','cdd','alternance','freelance','interim','stage'])).max(6),
  skills: z.array(z.string().trim().min(1).max(120)).max(80),
  experiences: z.array(z.object({
    title: string.min(1).max(200),
    company: string.max(200),
    location: string.max(200).optional().default(''),
    startDate: string.regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: string.regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    description: string.max(8000),
    sortOrder: number.int().min(0).optional(),
  })).max(40),
}
```

**ATS types** (`src/lib/profile/ats/types.ts`):

```typescript
export type AtsSeverity = 'error' | 'warning' | 'info';
export type AtsCategory =
  | 'contact'
  | 'structure'
  | 'keywords'
  | 'format'
  | 'content'
  | 'dates';

export type AtsFinding = {
  code: string;
  severity: AtsSeverity;
  category: AtsCategory;
  message: string;
  pointsDeducted: number;
};

export type AtsResult = {
  score: number; // 0..100 integer
  findings: AtsFinding[];
};
```

**Scoring:** `score = clamp(100 - sum(pointsDeducted), 0, 100)`.

**Rules** (each returns 0..n findings; implement in `src/lib/profile/ats/rules/*.ts`, registered in `runAtsAnalysis(text, ctx)`):

| Code | Cat. | Sev. | Trigger (summary) | Pts |
|------|------|------|-------------------|-----|
| `MISSING_EMAIL` | contact | error | no email regex in text and profile email empty | 15 |
| `WEAK_EMAIL_IN_CV` | contact | warning | email-like but invalid TLD | 5 |
| `MISSING_PHONE` | contact | warning | no phone pattern in text and profile phone empty | 8 |
| `TEXT_TOO_SHORT` | content | error | len < 450 | 20 |
| `TEXT_TOO_LONG` | content | warning | len > 18000 | 10 |
| `LOW_EXTRACTION_QUALITY` | content | error | U+FFFD or mojibake replacements > 2% of len | 15 |
| `MISSING_EXPERIENCE_SECTION` | structure | error | no experience header keywords (expérience/experience/emploi/positions held…) | 12 |
| `MISSING_EDUCATION_SECTION` | structure | warning | no education keywords (formation/diplôme/education/degree…) | 8 |
| `MISSING_SKILLS_SECTION` | structure | warning | no skills keywords and < 3 profile skills matched inline | 8 |
| `SKILLS_COVERAGE_LOW` | keywords | error | < 40% profile skills labels found in CV (case/diacritic-insensitive) | 15 |
| `SKILLS_COVERAGE_PARTIAL` | keywords | warning | 40–69% coverage | 7 |
| `SKILLS_COVERAGE_GOOD` | keywords | info | ≥ 70% coverage | 0 |
| `NO_DATES_DETECTED` | dates | error | no date patterns (YYYY, MM/YYYY, month names FR) | 12 |
| `INCONSISTENT_DATE_FORMATS` | dates | warning | ≥ 3 distinct date format families | 5 |
| `STALE_EXPERIENCE_END` | dates | warning | latest end date > 8 years ago (parsed) | 6 |
| `EXCESSIVE_SPECIAL_CHARS` | format | warning | non-alphanumeric ratio > 18% | 6 |
| `EXCESSIVE_SHORT_LINES` | format | warning | > 35% lines under 12 chars | 5 |
| `EXCESSIVE_ALL_CAPS` | format | warning | > 12% lines ALL CAPS | 5 |
| `SUSPECTED_COLUMNS` | format | warning | > 8% lines contain tab or 4+ consecutive spaces | 5 |
| `BULLET_OVERLOAD` | format | info | > 45% lines start with bullet glyphs | 0 |
| `DUPLICATE_CONTACT` | contact | warning | ≥ 2 email occurrences | 4 |
| `GENERIC_OPENING_ONLY` | content | warning | first 400 chars with no section keyword | 5 |
| `MISSING_ACTION_VERBS` | content | info | experience block with fewer than 2 common FR action verbs | 0 |

`runAtsAnalysis` receives `{ profileSkills: string[], profileEmail, profilePhone }` for cross-checks.

After CV parse or profile skills update: **re-run ATS** if `extracted_text` non-empty; persist `ats_score`, `ats_findings`, `ats_analyzed_at`.

**Server Actions** (`src/app/profil/actions.ts`):

| Action | Input | Effect |
|--------|-------|--------|
| `getProfile()` | — | Return full profile DTO (for RSC) |
| `saveProfile` | `ProfileUpdateInput` | Transaction upsert profile `1` + skills + experiences |
| `uploadCv` | `FormData` field `file` | Parse, ATS, update `profile_cv`; on parse fail return `{ ok: false, error: string }` |

**MIME allowlist:** `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (verify magic bytes where practical).

**CV parse errors (French):** `Fichier trop volumineux (max 5 Mo).` / `Format non supporté (PDF ou DOCX uniquement).` / `Impossible d'extraire le texte du CV.`

## Open questions

- None for this phase.

## Todos

- [x] Install `zod`, `pdf-parse`, `mammoth`, `@types/pdf-parse` per Contract; add `vitest` devDep + `package.json` `"test": "vitest run"`
- [x] Add `src/lib/profile/schemas.ts` with `ProfileUpdateInput` (strict) exactly as Contract
- [x] Add `src/lib/profile/ats/types.ts` exactly as Contract
- [x] Test: `src/lib/profile/ats/score.test.ts` — score clamp 0–100 and ≥3 Contract rule codes (red before rules land)
- [x] Implement `src/lib/profile/ats/rules/*.ts` and `runAtsAnalysis` in `src/lib/profile/ats/` per Contract rules table
- [x] Add `src/lib/profile/cv-parse.ts` — PDF/DOCX, 5 MiB max, MIME allowlist + French errors per Contract
- [x] Add `src/lib/profile/repository.ts` — load/save profile `id = 1`; transactional replace of skills and experiences
- [x] Add `src/app/profil/actions.ts` — `getProfile`, `saveProfile`, `uploadCv` per Contract
- [x] Add `src/app/profil/page.tsx` RSC loader using `getProfile` (data shell only; full UI is M3-03)
- [x] Test: `npm test`, `npm run build`, and `npx tsc --noEmit` pass

## UAT

- [x] (auto) `saveProfile` with valid Contract-shaped payload persists; `getProfile` returns matching DTO including skills and experiences
- [x] (auto) `uploadCv` with file > 5 MiB returns `{ ok: false, error }` with message `Fichier trop volumineux (max 5 Mo).`
- [x] (auto) `uploadCv` with disallowed MIME returns French `Format non supporté (PDF ou DOCX uniquement).`
- [x] (auto) `uploadCv` with unreadable/corrupt file returns `{ ok: false, error }` containing `Impossible d'extraire le texte du CV.`
- [x] (auto) `npm test` passes ATS unit coverage (clamp + Contract rule codes)
- [x] (auto) After non-empty `extracted_text`, updating profile skills re-runs ATS and persists `ats_score`, `ats_findings`, `ats_analyzed_at`
- [x] (auto) Server Action error responses contain no stack trace, SQL, or internal paths (shared-audit §3)
- [x] (auto) `npm audit --audit-level=high` pass (shared-audit §1)
