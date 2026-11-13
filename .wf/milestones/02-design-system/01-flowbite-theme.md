---
id: M2-01
phase: 1
role: web
status: done
branch: feat/m2-01-flowbite-theme
needs: []
---
# Flowbite + semantic theme

## Decisions

- **Setup:** `npx flowbite-react@latest init` (official Next + Tailwind CSS v4 wiring); then `npm install @heroicons/react`. No hand-rolled `tailwind.config` unless init fails and Flowbite docs require a documented one-line fix.
- **Config dir:** keep `.flowbite-react/` from init — `config.json` with `rsc: true`, `dark: true`, `version: 4`, `tsx: true`; commit what init generates (respect `.flowbite-react/.gitignore`).
- **Next config:** keep `output: "standalone"` from M1; merge Flowbite init changes into `next.config.ts` — do not drop the Flowbite bundler plugin.
- Central theme: **`createTheme`** from `flowbite-react` in **`src/lib/flowbite-theme.ts`**; export as **`flowbiteTheme`**. Semantic keys only (`primary`, gray/secondary, `success`, `warning`, `failure`) — no one-off hex in feature code later.
- **Primary palette:** Flowbite default **blue** scale mapped to `primary` until M2-03 documents brand colors.
- **`src/app/globals.css`:** keep `@import "tailwindcss"`; extend **`@theme inline`** with semantic color (+ spacing hook names for M2-03). `body` uses **`font-family: var(--font-sans)`** (Geist) — remove Arial override.
- **`src/components/providers/flowbite-theme-provider.tsx`:** `"use client"` wrapper; `ThemeProvider` with `theme={flowbiteTheme}` around `children`.
- **`src/app/layout.tsx`:** import provider; preserve `lang="fr"`, Geist font variables, existing metadata.
- **Fonts:** Geist from M1; typography scale names documented in M2-03 (no ad-hoc `text-[Npx]` in features).
- **Dark mode:** `prefers-color-scheme` in `globals.css` + Flowbite `dark: true`; tokens readable in light and dark for M2 UAT.
- **WCAG:** no new routes; contrast check on `/` after theme wire (UAT at plan).
- No `src/components/ui/` in this phase (M2-02). No feature screens beyond existing `/`.
- **dependenciesChanged:** yes (`flowbite-react` init + `@heroicons/react`).

## Contract

```bash
npx flowbite-react@latest init
npm install @heroicons/react
```

| Path | Purpose |
|------|---------|
| `.flowbite-react/config.json` | `rsc: true`, `dark: true`, `version: 4`, `tsx: true` |
| `next.config.ts` | `output: "standalone"` + Flowbite plugin from init |
| `src/lib/flowbite-theme.ts` | `export const flowbiteTheme = createTheme({ … })` |
| `src/components/providers/flowbite-theme-provider.tsx` | Client `ThemeProvider` |
| `src/app/layout.tsx` | Wrap `{children}` with provider |
| `src/app/globals.css` | `@theme` semantic tokens + Geist `body` font |

No files under `src/components/ui/` in this phase (M2-02).

## Todos

- [x] Run Contract init: `npx flowbite-react@latest init` and `npm install @heroicons/react` — `.flowbite-react/config.json` matches Contract flags; deps in `package.json`
- [x] Update `next.config.ts` — keep `output: "standalone"` and Flowbite bundler plugin from init
- [x] Add `src/lib/flowbite-theme.ts` — `export const flowbiteTheme = createTheme({ … })` with semantic keys (`primary` = blue scale, gray/secondary, success, warning, failure)
- [x] Add `src/components/providers/flowbite-theme-provider.tsx` — client `ThemeProvider` with `theme={flowbiteTheme}`
- [x] Update `src/app/layout.tsx` — wrap `{children}` with `FlowbiteThemeProvider`; preserve `lang="fr"`, Geist variables, metadata
- [x] Update `src/app/globals.css` — `@theme inline` semantic color (+ spacing hook names); `body` uses `var(--font-sans)`; remove Arial override; keep dark via `prefers-color-scheme`
- [x] Test: `npm run build` succeeds with Flowbite wired

## UAT

- [x] `npm run dev` → `/` loads without console errors; page still shows existing home content
- [x] View source: `<html lang="fr">`, Geist font variables on `<html>`, document title **Jobi**
- [x] Toggle OS light/dark — `/` background and text remain readable (no broken contrast on body defaults)
- [x] Keyboard: Tab through `/` — focus visible on interactive elements (no focus trap on load)
- [x] DS only (shared-design-system): no new `src/components/ui/`; theme tokens in `globals.css` / `flowbite-theme.ts`, not ad-hoc hex in feature paths
- [x] `npm audit --audit-level=high` — pass (shared-audit §1)
