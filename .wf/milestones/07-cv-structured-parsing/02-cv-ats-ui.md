---
id: M7-02
phase: 2
role: web
status: done
branch: milestone/07-cv-structured-parsing
needs: [M7-01]
---
# Interface `/profil` : CTA haut de page, badge IA/Local & aperçu structuré

## Decisions

- **CTA visible sans scroll en haut de `/profil`** :
  - Ajout d'un bloc d'action rapide tout en haut de la page `/profil` (au-dessus du formulaire `ProfileForm`) permettant :
    1. D'importer un CV directement (ou d'indiquer le CV déjà importé),
    2. De cliquer sur **« Remplir mon profil depuis le CV »** (`applyStructuredCvToProfile()`) dès qu'un CV structuré est présent, avec retour clair (succès / erreur) et rafraîchissement des champs du profil.
- **Transparence IA vs mode local (`AtsDisplay`)** :
  - Badge explicite à côté du score ATS :
    - `parseMode === "llm"` → Badge **« Analysé par IA »** (extraction sémantique avancée).
    - `parseMode === "deterministic"` → Badge **« Analyse locale (sans IA) »** + courte mention informant l'utilisateur que le parsing fonctionne sans clé API mais qu'une clé LLM (Mistral, OpenAI ou Claude) rend l'extraction plus précise sur les CV atypiques.
  - Bouton **« Réanalyser avec l'IA »** (`reanalyzeCvWithAi()`) affiché quand une clé LLM est disponible (ou avec lien vers les paramètres LLM sinon).
- **Aperçu structuré riche (`AtsDisplay`)** :
  - Affiche `structuredSections` persisté (fallback sur `extractCvStructuredDeterministic(extractedText)` si `structuredSections` est nul sur un ancien CV) :
    - `contact` (emails, téléphones, liens),
    - `skills` et `softSkills` en tags/badges,
    - `experiences` (poste, entreprise, dates, puces),
    - `education` (diplôme, établissement, année),
    - `other` (langues, projets, etc.).
- **Accessibilité & Design System** :
  - Utilisation exclusive des primitives `@/components/ui` (`Alert`, `Badge`, `Button`, `Card`) et icônes `@heroicons/react`.
  - Annonce `aria-live="polite"` sur les retours d'action (import, réanalyse, pré-remplissage) et navigation clavier complète.

## Structure

| Path | Purpose |
|------|---------|
| `src/app/profil/page.tsx` | Intégration du CTA haut de page (import / pré-remplissage) et passage du statut clé LLM |
| `src/components/profile/cv-quick-fill-banner.tsx` | Composant CTA haut de page : upload rapide + bouton « Remplir mon profil depuis le CV » + feedback |
| `src/components/profile/ats-display.tsx` | Badge mode IA/local, bouton « Réanalyser avec l'IA », affichage structuré riche (`experiences`, `education`, etc.) |
| `src/components/profile/*.test.tsx` | Tests composants (CTA haut de page, badge IA vs local, affichage sections riches) |

## Contract

**Props (`src/components/profile/cv-quick-fill-banner.tsx`) :**

```typescript
export type CvQuickFillBannerProps = {
  cv: ProfileCvDto | null;
  hasLlmKey: boolean;
};
```

**Props (`src/components/profile/ats-display.tsx`) :**

```typescript
export type AtsDisplayProps = {
  cv: ProfileCvDto | null;
  hasLlmKey?: boolean;
};
```

## Todos

- [x] Exporter `hasConfiguredLlmKey(): Promise<boolean>` dans `src/lib/profile/cv-llm-parser.ts` (réutilisant la lecture `llm_config` / `llm_<provider>` de `parseCvWithLlm`)
- [x] Test: `src/components/profile/cv-quick-fill-banner.test.tsx` — couvre upload rapide (`uploadCv`), bouton « Remplir mon profil depuis le CV » (`applyStructuredCvToProfile`), feedback `aria-live="polite"` et `router.refresh()` (doit échouer tant que `CvQuickFillBanner` n'est pas implémenté)
- [x] Créer `src/components/profile/cv-quick-fill-banner.tsx` conforme au Contract (`CvQuickFillBannerProps`) avec primitives `@/components/ui` (`Card`, `Button`, `Alert`, `FileInput`, `Label`) et icônes `@heroicons/react`
- [x] Test: `src/components/profile/ats-display.test.tsx` — couvre badge « Analysé par IA » vs « Analyse locale (sans IA) » + mention clé LLM, bouton « Réanalyser avec l'IA » (`reanalyzeCvWithAi`) ou lien `/parametres`, et aperçu structuré riche avec fallback `extractCvStructuredDeterministic` (doit échouer tant que `AtsDisplay` n'est pas mis à jour)
- [x] Mettre à jour `src/components/profile/ats-display.tsx` conforme au Contract (`AtsDisplayProps` avec `hasLlmKey?: boolean`) : badge IA/local, bouton réanalyse IA / lien `/parametres`, et rendu structuré riche (`contact`, `skills`, `softSkills`, `experiences`, `education`, `other`)
- [x] Propager `hasLlmKey?: boolean` dans `src/components/profile/cv-ats-section.tsx` et `src/components/profile/profile-form.tsx` (et synchroniser l'état du formulaire lors du rafraîchissement serveur après pré-remplissage)
- [x] Mettre à jour `src/app/profil/page.tsx` pour passer `hasLlmKey={await hasConfiguredLlmKey()}` et afficher `<CvQuickFillBanner cv={profile.cv} hasLlmKey={hasLlmKey} />` au-dessus de `<ProfileForm />`
- [x] Vérifier `src/components/profile/cv-ats-section.test.tsx`, `src/components/profile/accessibility.test.tsx` et exécuter `npm run test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`

## UAT

- [x] (auto) `npm run test` passe (incluant `cv-quick-fill-banner.test.tsx`, `ats-display.test.tsx`, `cv-ats-section.test.tsx`, `accessibility.test.tsx`)
- [x] (auto) `npx tsc --noEmit` et `npm run lint` passent sans erreur
- [x] (auto) `npm run build` passe sans erreur
- [x] (human) Sur `/profil`, le CTA haut de page (import CV + « Remplir mon profil depuis le CV ») est visible sans scroll et pré-remplit les champs du profil avec retour clair
- [x] (human) `AtsDisplay` affiche le badge IA/local exact, le bouton « Réanalyser avec l'IA » (ou lien `/parametres` sans clé) et les sections structurées riches, conformes au Design System (`shared-design-system.md`) en mode clair et sombre
- [x] (human) Navigation clavier complète (Tab + focus visible) et annonces `aria-live="polite"` sur `/profil` per `shared-audit.md` §4
