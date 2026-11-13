---
id: M2-04
phase: 4
role: qa
status: done
branch: feat/m2-04-tdd-backfill
needs: [M2-03]
---
# TDD backfill — design system

## Decisions

- **Logique pure** en tests node ; composants DS = smoke minimal ou ticket si besoin RTL.
- `flowbite-theme.ts` : assert clés sémantiques présentes (primary, alert colors).
- Tickets `test-gap` pour tests RTL lourds (`button.tsx`, etc.) — hors scope phase.

## Todos

- [x] Test: `src/lib/flowbite-theme.test.ts` — `flowbiteTheme` expose button/alert/badge sémantiques
- [x] Test: `npm test` && `npm run build`

## UAT

- [x] (auto) `npm test`
- [x] (auto) `npm run build`
