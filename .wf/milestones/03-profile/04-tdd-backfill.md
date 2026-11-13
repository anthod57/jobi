---
id: M3-04
phase: 4
role: qa
status: done
branch: feat/m3-04-tdd-backfill
needs: [M3-02]
---
# TDD backfill — profil (features existantes)

## Decisions

- Extraire logique UI testable vers `src/lib/profile/ats/*` (score band, ordre findings) — comportement UI inchangé.
- `profile-form-state`, actions déjà testés : compléter **repository** avec mock DB (Vitest + drizzle mock) en phase suivante si trop lourd.
- Composants React : ticket pour RTL ; cette phase = **lib + mapping** uniquement.

## Todos

- [x] Test: `src/lib/profile/ats/score-band.test.ts` — paliers Contract M3-03
- [x] Test: `src/lib/profile/ats/ats-findings-order.test.ts` — tri severity
- [x] Refactor `ats-display.tsx` → imports lib (pas de changement visuel)
- [x] Test: `src/components/profile/profile-form-state.test.ts` — mapping DTO → form
- [x] Test: `src/lib/profile/repository.test.ts` — `getProfile` mapping avec DB mockée (or ticket si refactor)
- [x] Test: `npm test` && `npm run build` && `npm run lint`

## UAT

- [x] (auto) `npm test`
- [x] (auto) GET `/profil` — score ATS affiche toujours les bandes French (smoke manuel ou existant)
