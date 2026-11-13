---
id: T-001
type: test-gap
status: open
source: src/lib/profile/repository.ts
created: 2026-11-13
---
# Integration tests profil repository (Drizzle/Postgres)

## Missing coverage
`getProfile`, `saveProfile`, `upsertCvAfterParse` — transactions, PROFILE_ID=1, mapping CV ATS.

## Plan
- [ ] Harness Postgres test (Docker / vitest globalSetup)
- [ ] `Test: src/lib/profile/repository.test.ts` red → green

## Blockers
Accès DB réel ou fake Drizzle ; pas de mock léger sans refactor injection `getDb`.

## Todos
- [ ] Décider stratégie (testcontainers vs DB CI compose)
