---
id: T-006
type: bug
status: done
severity: high
created: 2026-11-13
---
# Tailwind CSS non compile sous Turbopack (next.config.ts)

## Symptom
- **Attendu :** les pages (`/profil`, `/`) s'affichent avec les styles Tailwind CSS v4 et les composants Flowbite React.
- **Observé :** rendu HTML brut (police Times New Roman, fond noir, inputs/boutons non stylés) ; `src/app/globals.css` n'est pas compilé par Tailwind.

## Repro
1. Lancer `npm run dev` (ou `npm run build`).
2. Observer dans les logs de build les warnings `Unknown at rule: @source` et `Unknown at rule: @theme` sur `src/app/globals.css`.
3. Ouvrir `/profil` dans le navigateur : aucune classe utilitaire Tailwind ni style Flowbite n'est appliqué.

## Notes
- Branche : `master` (`5d88821`), Next.js `16.4.6` (Turbopack), `@tailwindcss/turbopack` `4.3.3` installé dans `package.json`.
- `next.config.ts` ne configure pas `turbopack.rules['*.css']` avec `@tailwindcss/turbopack` (et aucun `postcss.config.*` n'est présent).

## Todos
- [x] fix: configurer `turbopack.rules['*.css']` avec `@tailwindcss/turbopack` dans `next.config.ts`
- [x] verify: `npm run build` sans warning `@source`/`@theme` et `npm test` (65/65) verts (rendu visuel navigateur à confirmer par l'utilisateur)
