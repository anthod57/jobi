---
id: M1-04
phase: 4
role: qa
status: done
branch: feat/m1-04-tdd-backfill
needs: [M1-03]
---
# TDD backfill — Docker & health

## Decisions

- Backfill specs pour le code M1 **sans** changer le comportement observable.
- DB pool : test du garde `DATABASE_URL` uniquement (pas de test d’intégration PG ici).
- Health : déjà couvert par `src/lib/health.test.ts` — pas de duplication.

## Todos

- [x] Test: `src/lib/db.test.ts` — échoue si guard absent ; passe après guard
- [x] Vérifier `src/lib/health.test.ts` vert avec `npm test`
- [x] Test: `npm run build`

## UAT

- [x] (auto) `npm test` — tous verts
- [x] (auto) `npm run build`
