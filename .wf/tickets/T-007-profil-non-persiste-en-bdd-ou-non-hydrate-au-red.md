---
id: T-007
type: bug
status: done
severity: high
created: 2026-11-14
---
# Profil non persisté en BDD ou non hydraté au redémarrage du front

## Symptom
- **Attendu** : Après enregistrement du profil, les données sont persistées en BDD et réhydratées dans l'interface après un redémarrage du front.
- **Observé** : L'enregistrement semble conserver les infos en session, mais après redémarrage du front les infos ne sont plus là (soit non enregistrées en BDD, soit non réhydratées au chargement).

## Repro
1. Renseigner les informations du profil dans l'interface et cliquer sur Enregistrer.
2. Constater que les informations restent visibles tant que le front n'est pas redémarré.
3. Redémarrer le serveur front et rouvrir la page profil.
4. Constater que les informations enregistrées ne sont plus présentes.

## Notes
- Branche : `master`
- Environnement : local (Windows)
- À vérifier : appel API / mutation de sauvegarde en BDD et chargement/hydratation côté front au démarrage.

## Todos
- [x] fix: vérifier la persistance en BDD et l'hydratation du profil au chargement du front
