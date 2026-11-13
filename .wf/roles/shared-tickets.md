# Shared: tickets (bugs + test gaps)

Hors **phase** courante : pas de scope creep dans les todos du milestone — fichier **ticket** dédié.

## Types

| Type | Quand |
|------|--------|
| **`bug`** | Comportement cassé (prod, UAT, user) — symptom + repro |
| **`test-gap`** | Source sans test colocalisé ou refactor nécessaire avant spec |
| **`chore`** | Dette / outillage — rare |

## CLI

```text
wflow ticket add bug "titre" --severity high [--phase M2-01]
wflow ticket add test-gap "titre" --source src/lib/foo.ts
wflow ticket list --open
wflow ticket status T-003 doing
wflow ticket sync
```

Index : `.wf/TICKETS.md` (auto via CLI).

## Skills

| Skill | Rôle |
|-------|------|
| **`/wf-audit-tests`** | `wflow audit-tests` → rédiger specs manquants (red) ; **ticket** `test-gap` si prod à changer |
| **`/wf-file-bug`** | Créer ticket `bug` dès qu’un bug est observé (execute, verify, manuel) |

## Règles

- **Bug** → pas de « fix rapide » hors ticket ou todo de phase **bugfix** planifiée ; au minimum `wflow ticket add bug …`.
- **`wflow integrity`** → WARN si bug **open** `severity: high|critical`.
- Fermer ticket → `wflow ticket status T-xxx done` + commits liés ; mentionner l’id dans le message de commit (`fix(T-003): …`).

## vs phase todos

| Situation | Où |
|-----------|-----|
| Livraison prévue ce milestone | Phase todos (+ TDD) |
| Bug / test manquant hors scope phase | Ticket |
| Gros refactor testabilité | Ticket `test-gap` puis phase dédiée si besoin |
