---
id: T-004
type: test-gap
status: open
source: src/server/db/schema.ts
created: 2026-11-13
---
# Tests schéma Drizzle + contraintes SQL

## Missing coverage
Tables `profiles`, `profile_cv`, skills/experiences — types JSON ATS, FK, defaults.

## Plan
- [ ] Snapshots ou migrate test DB + assertions colonnes
- [ ] `Test: src/server/db/schema.test.ts` red → green

## Blockers
Définitions Drizzle seules ne valident pas la DB ; besoin migrate en test.

## Todos
- [ ] Dépend de harness T-001 / T-003
