---
id: T-010
type: bug
status: open
severity: high
created: 2026-11-14
---
# Parsing CV PDF + Score ATS non fonctionnel

## Symptom
- **Attendu** : L'upload d'un CV PDF extrait le texte du CV, met à jour le profil/CV et calcule + affiche le score ATS et ses recommandations.
- **Observé** : Le parsing du CV et le calcul/affichage du score ATS ne fonctionnent pas.

## Repro
1. Ouvrir `/profil` dans l'application.
2. Importer un CV au format PDF dans la section CV / ATS (`src/components/profile/cv-ats-section.tsx`).
3. Constater que le parsing du CV et le score ATS ne fonctionnent pas.

## Notes
- Branche : `master`
- Environnement : local Windows / Next.js (`src/lib/profile/cv-parse.ts`, `src/lib/profile/ats/runAtsAnalysis.ts`, `src/app/profil/actions.ts`, `src/components/profile/cv-ats-section.tsx`)
- Prévoir la création de 2-3 CV PDF de fixture avec différentes structures, couleurs et contenus pour les tests automatisés.

## Todos
- [ ] Créer 2-3 CV PDF de test (structures, couleurs et contenus variés) pour les tests automatiques
- [ ] Diagnostiquer et corriger le parsing PDF du CV (`src/lib/profile/cv-parse.ts`, `src/app/profil/actions.ts`)
- [ ] Diagnostiquer et corriger le calcul / affichage du score ATS (`src/lib/profile/ats/runAtsAnalysis.ts`, `src/components/profile/cv-ats-section.tsx`)
- [ ] Ajouter / exécuter les tests automatisés avec les CV PDF créés
