# Shared: red / green (feature TDD)

**Non négociable** pour tout todo qui ajoute un **comportement** (logique, API, UI, server action).

## Séquence

1. `Test: path/to/foo.test.ts` — écrire le spec du comportement attendu.
2. `wflow test red path/to/foo.test.ts` — **doit échouer** ; enregistre le red dans `.wf/cache/tests.json`.
3. Coder le minimum pour satisfaire le spec.
4. `wflow test green path/to/foo.test.ts` (ou `wflow test …`) — **doit passer**.
5. `wflow todo check` — le CLI refuse sans red/green valides (voir ci-dessous).

## Règles CLI (`wflow todo check`)

| Todo | Exigence |
|------|----------|
| `Test: …foo.test.ts` | `wflow test red foo.test.ts` déjà passé (spec inchangé depuis ce red) |
| Impl après ce Test | todo Test coché + `wflow test green foo.test.ts` |

Pas de red/green sur les todos smoke seuls (`Test: npm run build`, `curl`, etc.).

## Si le spec change

Relancer `wflow test red` (hash du fichier changé → red invalidé).

## Hors scope

Wiring DS, Docker, copie verbatim Contract, docs : pas de red ; smoke optionnel.
