---
id: M2-02
phase: 2
role: web
status: done
branch: feat/m2-02-ui-primitives
needs: [M2-01]
---
# UI primitives (Button, Input, Card, Alert)

## Decisions

- All primitives live in **`src/components/ui/`**, one file per component, **thin wrappers** around Flowbite React — no duplicate markup styles in features.
- **Exports:** named components `Button`, `Input`, `Card`, `Alert` (default export optional per file; barrel **`src/components/ui/index.ts`** re-exports all).
- **Button:** variants via Flowbite (`color`, `size`); support `disabled` and optional `isProcessing` / loading state using DS spinner (Flowbite).
- **Input:** text-like input with `disabled`, `color` for validation error (`failure`), no raw `<input className="...">` in feature code later.
- **Card:** composes Flowbite `Card` with consistent padding from tokens; accept `children` + optional title.
- **Alert:** `info` | `success` | `warning` | `failure` mapping to semantic colors; used for status messages (e.g. DB health).
- **Icons:** only `@heroicons/react` inside primitives when needed (e.g. alert icon); features import icons via primitives or Heroicons through documented pattern in M2-03.
- **No Label primitive** at M2 — add in a later milestone if forms need it (profile M3).

## Contract

| Path | Wraps (Flowbite) |
|------|------------------|
| `src/components/ui/button.tsx` | `Button` |
| `src/components/ui/input.tsx` | `TextInput` / `Textarea` (text field only for M2) |
| `src/components/ui/card.tsx` | `Card` |
| `src/components/ui/alert.tsx` | `Alert` |
| `src/components/ui/index.ts` | re-export all |

Each wrapper:

- Forwards relevant native / Flowbite props (`className` merge allowed).
- Uses semantic colors from theme only (no hard-coded `#hex`).

Optional colocated smoke test: `src/components/ui/button.test.tsx` only if executor adds non-trivial logic (otherwise skip).

## Todos

- [x] Implement four primitives under `src/components/ui/`
- [x] Add barrel `index.ts`
- [x] Test: `npm run build` and `npx tsc --noEmit`

## UAT

- [x] Temporary dev-only check (executor may use a throwaway route or Storybook-less import in a server test page **deleted before phase close**): each primitive renders default, disabled, and error/alert variant without console errors
- [x] Grep: no `flowbite-react` imports outside `src/components/ui/` and `src/app/layout.tsx` / theme file
