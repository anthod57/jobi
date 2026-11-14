---
id: M7-02
phase: 2
role: web
status: discuss
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

_(À planifier via `/wf-plan-phase M7-02`)_

## UAT

_(À planifier via `/wf-plan-phase M7-02`)_
