---
id: M3-03
phase: 3
role: web
status: done
branch: feat/m3-03-profile-ui
needs: [M2-03, M3-02]
---
# UI profil (/profil)

## Decisions

- Route **`/profil`** (French, `lang="fr"`).
- **Design system only** — Flowbite via `src/components/ui/*`; add **`Label`** primitive (Flowbite `Label`) for accessible forms (noted as M3 need in M2-02).
- **Single page** with sections: Identité & contact, Préférences de recherche, Compétences, Expériences, CV & ATS.
- **Compétences:** tag input (add/remove chips) bound to `skills[]`.
- **Expériences:** liste éditable (add/remove rows) with date inputs `type="date"`.
- **Préférences:** `locationLabel`, `searchRadiusKm` (number), `remotePreference` (select), `contractTypes` (checkbox group), `minSalaryAnnualGross` (optional number).
- **CV:** `FileInput` (Flowbite) PDF/DOCX; show **ATS score** (0–100) + **Alert** list grouped by severity (`failure`/`warning`/`info`).
- **Navigation:** link **Profil** depuis la home (`src/app/page.tsx`) vers `/profil`.
- **WCAG:** labels associés, focus visible, erreurs reliées aux champs; keyboard operable add/remove for skills and experiences.
- **No scoring / offres UI** — M3 scope only.

## Structure

| Path | Purpose |
|------|---------|
| `src/components/ui/label.tsx` | DS wrapper `Label` |
| `src/components/ui/index.ts` | export `Label` |
| `src/components/profile/*` | Feature UI sections (client components where needed) |
| `src/app/profil/page.tsx` | RSC shell + compose sections |
| `src/app/page.tsx` | Add nav link to `/profil` |

## Contract

**`Label` primitive** — wraps `flowbite-react` `Label`; props: `htmlFor`, `value` (text), optional `color` for error state.

**Page layout:**

- `max-w-3xl` container, heading **Mon profil**, save button sticky/footer **Enregistrer**.
- Client form uses `saveProfile` Server Action; optimistic disable + toast/Alert on success/failure (Flowbite `Alert`).

**ATS display:**

- Score: numeric + short label band: 0–49 **Insuffisant**, 50–74 **Moyen**, 75–89 **Bon**, 90–100 **Excellent** (French, DS Badge colors).
- Findings: render `ats_findings` ordered error → warning → info.

**File upload:**

- Client component calls `uploadCv`; while pending show processing state on Button/FileInput; refresh ATS block on success (`router.refresh()`).

**Home link:**

```tsx
// src/app/page.tsx — add visible link:
<Link href="/profil">Mon profil</Link>
```

Use DS `Button` as link or Flowbite `Button as={Link}` pattern consistent with existing home.

## Open questions

- None for this phase.

## Todos

- [x] Add `src/components/ui/label.tsx` per Contract and export `Label` from `src/components/ui/index.ts`
- [x] Add `src/components/profile/` section components (identity, preferences, skills, experiences, cv-ats) per Decisions
- [x] Compose `src/app/profil/page.tsx` — `max-w-3xl`, heading **Mon profil**, sticky/footer **Enregistrer** per Contract
- [x] Wire client form to `saveProfile` with Flowbite `Alert` on success/failure per Contract
- [x] Wire CV client upload to `uploadCv` with pending state and `router.refresh()` on success per Contract
- [x] Update `src/app/page.tsx` — visible `<Link href="/profil">Mon profil</Link>` per Contract (DS link pattern)
- [x] Test: `npm run build`, `npm run lint`, and `npx tsc --noEmit`

## UAT

- [x] (auto) `npm run build` succeeds
- [x] (auto) GET `http://localhost:3000/profil` (dev or compose) — `<html lang="fr">`, document title reflects profil page
- [x] (auto) Home `/` shows link to `/profil`; navigation reaches profil route without 404
- [x] (human) Keyboard: Tab through `/profil` form — focus visible; add/remove skill chips and experience rows operable without mouse
- [x] (human) Toggle OS light/dark — `/profil` text and controls remain readable (contrast)
- [x] (human) DS only (shared-design-system): feature code imports UI from `@/components/ui`; no `flowbite-react` outside `src/components/ui/` and allowed layout/theme paths
