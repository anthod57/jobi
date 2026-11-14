---
id: T-008
type: bug
status: done
severity: medium
created: 2026-11-14
---
# Passe UI/UX : espacements, tailles de champs, responsivité et RGAA/WCAG

## Symptom
- **Attendu** : Interface homogène (espacements, tailles de champs), responsive sur mobile/tablette/desktop et conforme aux critères RGAA/WCAG (contrastes, labels, focus, navigation clavier, ARIA).
- **Observé** : Une passe complète UI/UX et accessibilité est nécessaire pour vérifier et corriger les incohérences visuelles, de responsivité et de conformité RGAA/WCAG.

## Repro
1. Parcourir les différentes vues de l'application sur desktop, tablette et mobile.
2. Contrôler l'harmonie des espacements, l'alignement et les tailles des champs de formulaire.
3. Vérifier la responsivité (débordements, grilles, navigation) et l'accessibilité RGAA/WCAG (contraste, labels associés, ordre de tabulation, focus visible, attributs ARIA).

## Notes
- Branche : `master`
- Environnement : local (Windows)
- Périmètre : espacements, tailles de champs, responsivité, RGAA/WCAG.

## Todos
- [x] fix: auditer et harmoniser espacements, tailles de champs et responsivité
- [x] fix: auditer et corriger la conformité RGAA/WCAG sur les vues et composants
