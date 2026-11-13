## Summary

- **Goal:** `docker compose up` démarre Next.js + Postgres ; écran d'accueil sain (healthchecks OK).
- **WF:** M1 **done** — 3/3 phases (100%)
- **Phases:** `.wf/milestones/01-docker/` (01 scaffold, 02 compose, 03 health-home) — todos + UAT signés

## Ship checks

- [x] `wflow integrity`
- [x] `npm run lint`
- [x] `npm audit --audit-level=high`
- [x] `npm run build`

## Test plan

- [ ] `docker compose up --build -d` — `db` + `app` healthy
- [ ] http://localhost:3000 — Jobi + statut DB
- [ ] http://localhost:3000/api/health — 200 JSON ok
