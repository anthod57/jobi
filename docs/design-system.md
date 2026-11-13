# Design system (Jobi)

Single reference for UI in this repo. Feature code uses primitives from `@/components/ui` only — not raw Flowbite or ad-hoc hex colors.

## 1. Stack

| Layer | Choice |
|-------|--------|
| Components | [Flowbite React](https://flowbite-react.com/) (wrapped in `src/components/ui/`) |
| Styling | Tailwind CSS v4 (`@theme inline` + `@custom-variant dark` in `src/app/globals.css`) |
| Theme overrides | `src/lib/flowbite-theme.ts` via `FlowbiteThemeProvider` + `ThemeModeScript` |
| Icons | [`@heroicons/react`](https://heroicons.com/) (`/24/outline` or `/24/solid`) |

## 2. Tokens & Dark Mode

Semantic palettes live in `src/app/globals.css` under `@theme inline`:

- **primary** — Indigo accent (`primary-600` for primary actions, active icons)
- **secondary** — Zinc neutral scale (`secondary-50`..`secondary-950` for canvas, surfaces, `1px` borders, text)
- **success**, **warning**, **failure** — status and validation

Light/dark mode is controlled by `.dark` on `<html>`, initialized without FOUC via `ThemeModeScript` in `src/app/layout.tsx` and toggled by `ThemeToggle` in `AppShell`.

Flowbite component class overrides live in `src/lib/flowbite-theme.ts`. Do not duplicate those strings in feature files.

**Forbidden:** arbitrary `#hex` or one-off `text-zinc-*` in features when a semantic token exists — use `text-secondary-*`, `border-secondary-*`, `text-success-*`, etc., or Flowbite variant props on primitives.

## 3. Typography & Spacing

### Typography

| Role | Tailwind classes | Use |
|------|------------------|-----|
| Page heading (`h1`) | `text-2xl font-semibold tracking-tight text-secondary-950 dark:text-white` | Main page title |
| Card title (`Card`) | `text-xl font-semibold` (via `Card` `title`) | Section heading on a surface |
| Lead / subtitle | `text-sm text-secondary-600 dark:text-secondary-400` | Supporting line under heading |
| Body | `text-base` or `text-sm` | Default copy |
| Small / meta | `text-xs text-secondary-500` | Hints, captions, footer |

Fonts: Geist Sans (`font-sans`), Geist Mono (`font-mono`) from `layout.tsx`.

### Spacing

| Token | CSS variable | Tailwind | Use |
|-------|--------------|----------|-----|
| Page padding | `--spacing-page` (`1.5rem`) | `p-page` | Outer padding on `<main>` in `AppShell` |
| Section gap | `--spacing-section` (`1.5rem`) | `gap-section`, `space-y-section`, `mt-section` | Between major blocks |
| Stack gap | `--spacing-stack` (`1rem`) | `gap-stack`, `mt-stack` | Related controls / alerts in a card |

## 4. App Shell & Primitives

All pages are wrapped by `AppShell` (`src/components/layout/app-shell.tsx`) in `src/app/layout.tsx`:
- **Sidebar**: fixed on desktop (`lg:block`), accessible drawer on mobile.
- **Header**: sticky top bar with mobile menu toggle, contextual page label, `ThemeToggle`, and profile `Dropdown` (`Avatar`).
- **Main**: `<main id="main-content" className="flex-1 p-page">` with `max-w-6xl` container.
- **Footer**: subtle single-row footer.

Import primitives from **`@/components/ui`**:

```ts
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Dropdown,
  FileInput,
  Footer,
  Input,
  Label,
  Navbar,
  Select,
  Sidebar,
  ThemeToggle,
  Tooltip,
} from "@/components/ui";
```

## 5. Rules & Anti AI Slop

1. **Features** import UI only from `@/components/ui` — never `flowbite-react` in `src/app` (except `ThemeModeScript` in `layout.tsx` and `FlowbiteThemeProvider`).
2. **No raw `<input className="…">`** in features — use `Input`.
3. **Status messages** use `Alert` or `Badge` with the right semantic `variant`/`color`.
4. **Dark mode:** always pair `dark:` classes with semantic tokens.
5. **Anti AI Slop:** no decorative gradients, no gratuitous `backdrop-blur` glassmorphism, no heavy `shadow-xl` cards (prefer crisp `1px` `border-secondary-200 dark:border-secondary-800`), and no fake KPIs or charts on placeholder screens.
