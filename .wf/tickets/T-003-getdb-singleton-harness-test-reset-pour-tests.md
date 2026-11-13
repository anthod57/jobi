---
id: T-003
type: test-gap
status: open
source: src/server/db/client.ts
created: 2026-11-13
---
# getDb singleton: harness test / reset pour tests

## Missing coverage
`getDb()` singleton Drizzle + erreur si URL manquante.

## Plan
- [ ] `resetDbForTests()` ou injection
- [ ] `Test: src/server/db/client.test.ts` red → green

## Blockers
Module state global ; tests parallèles impossibles sans reset prod.

## Todos
- [ ] Aligner avec T-001 harness DB
