---
id: M2-05
phase: 5
role: web
status: done
branch: feat/m2-05-app-shell-ds-v2
needs: [M2-04]
---
# App Shell SaaS & Design System v2

## Decisions

- **App Shell** : Sidebar fixe à gauche (drawer repliable sur mobile) + Header contextuel en haut + Zone de contenu `<main>` fluide + Footer discret.
- **Navigation & Routes** :
  - `/` — Tableau de bord (accueil, statut DB, accès rapides)
  - `/offres` — Offres (placeholder *empty state* sobre)
  - `/candidatures` — Candidatures (placeholder *empty state* sobre)
  - `/profil` — Mon profil (page existante intégrée dans le shell)
- **Direction visuelle** : Sobre & structurée (type Linear / Stripe / Vercel) — neutres Slate/Zinc précis, bordures fines `1px`, accent unique net (Indigo / Bleu roi), support **light + dark mode** avec toggle persistant (`ThemeModeScript`).
- **Librairie UI** : Rester strictement sur `flowbite-react` wrappé dans `src/components/ui/` (aucun import direct de `flowbite-react` dans `src/app/` hors `ThemeModeScript` dans `layout.tsx`, ni dans `src/components/layout/` ou `src/components/profile/`). Restyler `src/lib/flowbite-theme.ts` pour un rendu moderne.
- **Anti AI Slop** : Aucun gradient décoratif, aucun glassmorphism gratuit, aucun faux KPI/graphique sur les placeholders, aucune couleur ad-hoc hors tokens `@theme`.
- **Dependencies** : `dependenciesChanged: no` (`flowbite-react` et `@heroicons/react` déjà installés).
- **Reference ticket** : `docs/tickets/M2-05-app-shell-design-system.md`.

## Contract

| Path | Responsibility |
|------|----------------|
| `src/app/globals.css` | Tokens `@theme inline` définitifs (Slate/Zinc, accent Indigo/Bleu roi, spacing) + variables light/dark |
| `src/lib/flowbite-theme.ts` | Overrides Flowbite modernes (existants + `sidebar`, `navbar`, `footer`, `dropdown`, `avatar`, `tooltip`) |
| `src/components/ui/sidebar.tsx` | Wrapper Flowbite `Sidebar` |
| `src/components/ui/navbar.tsx` | Wrapper Flowbite `Navbar` |
| `src/components/ui/footer.tsx` | Wrapper Flowbite `Footer` |
| `src/components/ui/dropdown.tsx` | Wrapper Flowbite `Dropdown` |
| `src/components/ui/avatar.tsx` | Wrapper Flowbite `Avatar` |
| `src/components/ui/tooltip.tsx` | Wrapper Flowbite `Tooltip` |
| `src/components/ui/theme-toggle.tsx` | Wrapper Flowbite `DarkThemeToggle` |
| `src/components/ui/index.ts` | Barrel export de toutes les primitives |
| `src/components/layout/app-shell.tsx` | Shell applicatif (`Sidebar` + `Header` + `<main>` + `Footer`, état actif `usePathname`, drawer mobile) |
| `src/app/layout.tsx` | `ThemeModeScript` + `FlowbiteThemeProvider` + `AppShell` |
| `src/app/page.tsx` | Accueil / Tableau de bord intégré au shell (statut DB + raccourcis) |
| `src/app/offres/page.tsx` | Placeholder *empty state* sobre |
| `src/app/candidatures/page.tsx` | Placeholder *empty state* sobre |
| `src/app/profil/page.tsx` | Alignement espacement avec `<main>` du shell |
| `docs/design-system.md` | Documentation tokens, dark mode, nouvelles primitives et règles |

## Todos

- [x] Test: `src/components/ui/navigation-primitives.test.tsx` — fails until `Sidebar`, `Navbar`, `Footer`, `Dropdown`, `Avatar`, `Tooltip`, and `ThemeToggle` are exported from `@/components/ui` and render without errors
- [x] Test: `src/components/layout/app-shell.test.tsx` — fails until `AppShell` renders navigation links (`/`, `/offres`, `/candidatures`, `/profil`), marks active route with `aria-current="page"`, toggles mobile drawer, and renders footer
- [x] Update `src/app/globals.css` — finalize `@theme inline` semantic palette (Slate/Zinc neutrals, Indigo/Royal Blue primary, spacing tokens) and light/dark CSS variables
- [x] Update `src/lib/flowbite-theme.ts` — restyle existing primitives and add `sidebar`, `navbar`, `footer`, `dropdown`, `avatar`, `tooltip` theme overrides
- [x] Create `src/components/ui/{sidebar,navbar,footer,dropdown,avatar,tooltip,theme-toggle}.tsx` and export all from `src/components/ui/index.ts`
- [x] Create `src/components/layout/app-shell.tsx` — responsive SaaS shell (sidebar + mobile drawer, header with `ThemeToggle` + profile `Dropdown`, `<main>`, subtle `Footer`)
- [x] Update `src/app/layout.tsx` — add `ThemeModeScript` and wrap `{children}` with `AppShell` inside `FlowbiteThemeProvider`
- [x] Update `src/app/page.tsx` — refactor welcome view into dashboard overview inside `AppShell` (DB health status + quick links, no fake KPIs)
- [x] Create `src/app/offres/page.tsx` and `src/app/candidatures/page.tsx` — clean empty-state placeholders using `@/components/ui` and Heroicons
- [x] Update `src/app/profil/page.tsx` — align container spacing with `AppShell` `<main>` padding
- [x] Update `docs/design-system.md` — document updated tokens, light/dark toggle, layout/navigation primitives, and Anti AI Slop rules
- [x] Test: run `npm run lint`, `npm test`, `npx tsc --noEmit`, and `npm run build` — all pass with 0 errors

## UAT

- [x] (auto) `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npm test` pass with 0 errors
- [x] (auto) GET `/`, `/profil`, `/offres`, `/candidatures` return HTTP 200 with `lang="fr"`, Geist font classes, and AppShell landmarks (`<nav>`, `<main>`, `<footer>`)
- [x] (auto) Grep confirms zero direct `flowbite-react` imports in `src/app/` (except `ThemeModeScript` in `layout.tsx`), `src/components/layout/`, or `src/components/profile/`
- [x] (human) Keyboard navigation (`Tab` / `Enter` / `Escape` on mobile drawer & dropdown) and `focus-visible` rings work across `AppShell`
- [x] (human) Light/dark toggle persists across reload without FOUC and maintains readable contrast on all surfaces and `1px` borders
- [x] (human) DS & Anti-AI-Slop spot-check: clean Linear/Vercel-inspired hierarchy, no decorative gradients, no fake KPIs on placeholders
