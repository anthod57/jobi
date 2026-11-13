---
id: T-002
type: test-gap
status: done
source: src/lib/db.ts
created: 2026-11-13
---
# Pool module: test sans DATABASE_URL à l'import

## Missing coverage
Export `pool` — connexion health route `/api/health`.

## Plan
- [ ] Lazy init ou factory testable
- [ ] `Test: src/lib/db.test.ts` red → green

## Blockers
`throw` à l'import si `DATABASE_URL` absent — bloque import en vitest.

## Todos
- [ ] Extraire `createPool(url)` + init à la demande
