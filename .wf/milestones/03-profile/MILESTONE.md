---
id: M3
title: Profil utilisateur local
status: active
branch: milestone/03-profile
---
# M3 — Profil

**Goal:** l’utilisateur saisit et modifie profil + CV (ATS, compétences, expériences, préférences) ; tout est persisté en SQL local.

**Out of scope:** scoring, import offres, LLM candidature.

## Phases

| # | File | Role | Needs | Status |
|---|------|------|-------|--------|
| 01 | 01-drizzle-schema.md | api | M1-02 | done |
| 02 | 02-profile-server.md | api | M3-01 | done |
| 03 | 03-profile-ui.md | web | M2-03, M3-02 | done |
| 04 | 04-tdd-backfill.md | qa | M3-02 | review |

## Decisions (jalon)

| Sujet | Choix |
|-------|--------|
| CV fichier | Parse uniquement — texte + métadonnées en SQL, pas de stockage fichier |
| ORM | Drizzle + drizzle-kit |
| Compétences / expériences | Tables normalisées |
| Préférences | Lieu + rayon km + télétravail + types contrat + salaire min + compétences |
| API | Server Actions + RSC |
| ATS | Score 0–100 + constats ; règles poussées type ATS recruteur |





























