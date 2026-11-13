# [M2-05] App Shell SaaS & Design System v2

## Contexte & Objectif

Actuellement, le front-end de **Jobi** est minimaliste : la page d'accueil (`/`) affiche une simple `Card` centrée avec le statut de la base de données et un lien vers `/profil`, sans structure de navigation globale ni hiérarchie d'application. Par ailleurs, `src/app/globals.css` contient encore les tokens provisoires (`Flowbite blue scale until M2-03 brand`, `spacing hooks — values in M2-03`).

L'objectif de ce ticket est de poser le **squelette applicatif (App Shell)** et de **faire évoluer le design system** vers une interface SaaS moderne, sobre et structurée (références : Linear, Stripe, Vercel) en s'appuyant sur `flowbite-react` wrappé dans `@/components/ui`, **sans AI slop**.

---

## Décisions d'architecture & de design

- **Structure (App Shell)** : Sidebar fixe à gauche (repliable en drawer sur mobile/tablette) + Header contextuel en haut + Zone de contenu principale fluide + Footer discret.
- **Navigation & Routes** :
  - `/` — **Tableau de bord** (accueil, état système/DB, accès rapide aux sections)
  - `/offres` — **Offres** (page placeholder structurée)
  - `/candidatures` — **Candidatures** (page placeholder structurée)
  - `/profil` — **Mon profil** (page existante intégrée dans le shell)
- **Direction visuelle** : Sobre & structurée — neutres Slate/Zinc précis, bordures fines `1px` (`border-secondary-200 dark:border-secondary-800`), accent unique net (Indigo ou Bleu roi), support **light + dark mode** avec toggle utilisateur.
- **Librairie UI** : Rester strictement sur `flowbite-react` wrappé dans `src/components/ui/` (jamais d'import direct de `flowbite-react` dans `src/app/` ou les features, conformément à `docs/design-system.md`), en restylant `src/lib/flowbite-theme.ts` pour supprimer l'aspect "Flowbite par défaut".

---

## Spécifications détaillées

### 1. Design System & Tokens (`src/app/globals.css` & `src/lib/flowbite-theme.ts`)

- **Palette sémantique (`@theme inline` dans `globals.css`)** :
  - Remplacer l'échelle `primary` provisoire par la couleur d'accent définitive (ex. Indigo/Bleu roi net, lisible en light et dark mode).
  - Affiner `secondary` sur une échelle Slate/Zinc neutre et cohérente pour les surfaces, bordures et textes (`surface`, `surface-muted`, `border` si pertinent, ou tokens `secondary-*` documentés).
  - Définir les valeurs de spacing définitives (`--spacing-page`, `--spacing-section`, `--spacing-stack`) et les rayons/ombres subtils (privilégier les bordures `1px` aux ombres lourdes).
- **Thème Flowbite (`src/lib/flowbite-theme.ts`)** :
  - Restyler les composants existants (`button`, `alert`, `badge`, `card`, `textInput`, `select`, etc.) pour un rendu plat, net et moderne (bordures fines, focus rings propres, transitions discrètes).
  - Ajouter les overrides de thème pour les nouveaux composants layout/navigation (`sidebar`, `navbar`, `dropdown`, `footer`, `avatar`, `tooltip`).
- **Dark / Light Mode** :
  - Configurer `ThemeModeScript` (Flowbite) dans `src/app/layout.tsx` pour éviter le flash au chargement (FOUC) et supporter le toggle clair/sombre persistant.
- **Documentation** :
  - Mettre à jour `docs/design-system.md` avec les nouveaux tokens, primitives et règles de layout.

### 2. Nouvelles primitives `@/components/ui`

Créer et exporter dans `src/components/ui/index.ts` des wrappers typés autour de `flowbite-react` (avec icônes `@heroicons/react/24/outline` si nécessaire) :
- `Sidebar` (items, groupes, état actif basé sur la route, support collapse/drawer mobile)
- `Navbar` / `Header` (barre supérieure contextuelle)
- `Footer` (pied de page discret)
- `Dropdown` (menus contextuels, ex. menu profil/actions rapides)
- `Avatar` (initiales / identité utilisateur)
- `Tooltip` (infobulles sur icônes ou actions compactes)
- `ThemeToggle` (basé sur `DarkThemeToggle` de Flowbite ou contrôle équivalent)

### 3. App Shell (`src/components/layout/app-shell.tsx` ou équivalent)

Intégrer le shell dans `src/app/layout.tsx` (ou layout dédié) pour envelopper toutes les pages :
- **Sidebar (gauche)** :
  - Logo / nom **Jobi** en haut.
  - Liens de navigation principaux : Tableau de bord (`/`), Offres (`/offres`), Candidatures (`/candidatures`), Mon profil (`/profil`), avec mise en évidence claire de la route active (`usePathname`).
  - Sur mobile (`< lg` ou `< md`) : masquée par défaut, ouverte via un bouton menu dans le header (drawer/overlay accessible au clavier).
- **Header (haut)** :
  - Bouton hamburger sur mobile pour ouvrir la sidebar.
  - Fil d'Ariane ou titre contextuel de la page courante (optionnel/sobre).
  - Actions à droite : `ThemeToggle` (light/dark) + `Dropdown` utilisateur/profil (`Avatar` + lien rapide vers `/profil`).
- **Zone de contenu (`<main>`)** :
  - Conteneur centré avec largeur max confortable (ex. `max-w-6xl` ou `max-w-7xl`), padding `--spacing-page`, fond distinct de la sidebar/header pour une hiérarchie visuelle nette.
- **Footer (bas)** :
  - Discret, une ligne : nom de l'instance (`Jobi — Instance locale`), version (`package.json` ou constante), lien utile éventuel (ex. statut santé `/api/health` ou doc).

### 4. Adaptation des pages existantes & Placeholders

- **Accueil (`/`)** :
  - Remplacer la `Card` isolée centrée verticalement par un vrai écran d'accueil intégré au shell : en-tête de page sobre, statut système/base de données (`Alert` ou `Badge` de statut), et raccourcis utiles (ex. compléter son profil, accéder aux futures sections).
- **Mon profil (`/profil`)** :
  - Vérifier l'intégration fluide dans le nouveau shell (suppression des marges redondantes si `<main>` gère déjà `p-page`, cohérence des titres et cartes).
- **Placeholders `/offres` et `/candidatures`** :
  - Créer des pages propres utilisant un pattern "Empty state" sobre (icône `@heroicons/react`, titre, courte description de la fonctionnalité à venir, CTA éventuel vers `/profil`).

---

## Garde-fous « Anti AI Slop »

Pour garantir un rendu professionnel et moderne, les pratiques suivantes sont **interdites** :
- ❌ Gradients décoratifs génériques (violet/rose/cyan), effets néon ou glassmorphism (`backdrop-blur` gratuit sur des cartes).
- ❌ Faux KPIs, graphiques factices ou compteurs inventés sur le tableau de bord ou les placeholders.
- ❌ Cartes surchargées d'icônes colorées, ombres portées excessives (`shadow-xl`/`shadow-2xl`) ou animations superflues.
- ❌ Couleurs ou styles ad-hoc hors des tokens `@theme` et des primitives `@/components/ui`.

---

## Critères d'acceptation

- [ ] L'App Shell (Sidebar + Header + Content + Footer) s'affiche sur `/`, `/profil`, `/offres` et `/candidatures`.
- [ ] La navigation indique visuellement la route active et fonctionne au clavier (focus visible, `aria-current="page"`).
- [ ] Sur mobile, la sidebar se replie dans un drawer accessible via un bouton dans le header.
- [ ] Le toggle Light / Dark mode fonctionne sans flash au rechargement et toutes les surfaces/bordures respectent un contraste lisible dans les deux modes.
- [ ] Aucune page ou composant métier n'importe directement `flowbite-react` (tout passe par `@/components/ui`).
- [ ] `docs/design-system.md` est à jour avec les nouveaux tokens et primitives.
- [ ] Tests : tests unitaires/UI (`vitest`) pour les nouvelles primitives critiques et l'App Shell (rendu, navigation active, toggle mobile) ; `npm run lint`, `npm test` et `npm run build` passent sans erreur.

---

## Hors périmètre (Out of scope)

- Implémentation métier des pages `/offres` (scraping, liste, filtres) et `/candidatures` (kanban, suivi).
- Authentification multi-utilisateurs / login (Jobi reste une instance locale).
- Refactoring complet du formulaire `/profil` au-delà de son intégration visuelle dans le shell.
