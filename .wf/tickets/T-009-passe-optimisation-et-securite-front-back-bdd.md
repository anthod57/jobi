---
id: T-009
type: bug
status: doing
severity: high
created: 2026-11-14
---
# Passe optimisation et sécurité (front, back, BDD)

## Symptom
- **Attendu** : Code front, back et requêtes/schéma BDD optimisés (performances, requêtes, bundle/renders) et sécurisés (validation aux frontières, injections, exposition de données, headers/auth).
- **Observé** : Une passe complète d'optimisation et de sécurité est nécessaire sur les trois couches (front, back, BDD) pour identifier et corriger les failles ou goulots d'étranglement.

## Repro
1. Auditer le front-end : rendus inutiles, taille de bundle, gestion des secrets/données sensibles, XSS/CSRF.
2. Auditer le back-end : validation des entrées, gestion des erreurs, autorisations, exposition de données, appels réseau/LLM.
3. Auditer la BDD : requêtes N+1, index manquants, requêtes paramétrées, contraintes d'intégrité et droits d'accès.

## Notes
- Branche : `master`
- Environnement : local (Windows)
- Périmètre : optimisation et sécurité front / back / BDD.

## Todos
- [x] fix: auditer et corriger la sécurité front, back et BDD
- [ ] fix: auditer et optimiser les performances front, back et requêtes BDD
