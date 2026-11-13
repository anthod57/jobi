# Design system (Jobi)

Single reference for UI in this repo. Feature code uses primitives from `@/components/ui` only — not raw Flowbite or ad-hoc hex colors.

## 1. Stack

| Layer | Choice |
|-------|--------|
| Components | [Flowbite React](https://flowbite-react.com/) (wrapped in `src/components/ui/`) |
| Styling | Tailwind CSS v4 (`@theme` in `src/app/globals.css`) |
| Theme overrides | `src/lib/flowbite-theme.ts` via `FlowbiteThemeProvider` |
| Icons | [`@heroicons/react`](https://heroicons.com/) — only inside primitives (or via documented patterns) |

## 2. Tokens

Semantic palettes live in `src/app/globals.css` under `@theme inline`:

- **primary** — primary actions, default buttons
- **secondary** — neutral gray scale
- **success**, **warning**, **failure** — status and validation

Flowbite component class overrides (button, alert, badge) are in `src/lib/flowbite-theme.ts`. Do not duplicate those strings in feature files.

**Forbidden:** arbitrary `#hex` or one-off `text-zinc-*` in features when a semantic token exists — use `text-secondary-*`, `text-success-*`, etc., or Flowbite variant props on primitives.

## 3. Typography & spacing

### Typography

| Role | Tailwind classes | Use |
|------|------------------|-----|
| Page title (in `Card`) | `text-xl font-semibold` (via `Card` `title`) | Main heading on a surface |
| Lead / subtitle | `text-lg text-secondary-600 dark:text-secondary-400` | Supporting line under title |
| Body | `text-base` | Default copy |
| Small / meta | `text-sm text-secondary-500` | Hints, captions |

Fonts: Geist Sans (`font-sans`), Geist Mono (`font-mono`) from `layout.tsx`.

### Spacing

| Token | CSS variable | Tailwind | Use |
|-------|--------------|----------|-----|
| Page padding | `--spacing-page` (2rem) | `p-page` | Outer padding on `<main>` |
| Section gap | `--spacing-section` (1.5rem) | `gap-section`, `mt-section` | Between major blocks |
| Stack gap | `--spacing-stack` (1rem) | `gap-stack`, `mt-stack` | Related controls / alerts in a card |

## 4. Primitives

Import from **`@/components/ui`**:

```ts
import { Alert, Button, Card, Input } from "@/components/ui";
```

### Button

Flowbite `Button` wrapper. Supports Flowbite `color`, `size`, `disabled`, plus `isProcessing` (shows spinner).

```tsx
<Button color="primary">Enregistrer</Button>
<Button disabled>Indisponible</Button>
<Button isProcessing>Envoi…</Button>
```

### Input

Flowbite `TextInput`. Use `color="failure"` for validation errors.

```tsx
<Input placeholder="E-mail" />
<Input color="failure" placeholder="Champ invalide" />
```

### Card

Flowbite `Card` with optional `title`.

```tsx
<Card title="Jobi">
  <p className="text-lg text-secondary-600">Sous-titre</p>
</Card>
```

### Alert

Semantic `variant`: `info` | `success` | `warning` | `failure` (default icons from Heroicons).

```tsx
<Alert variant="success">Base de données : OK</Alert>
<Alert variant="failure">Base de données : indisponible</Alert>
```

## 5. Rules

1. **Features** import UI only from `@/components/ui` — never `flowbite-react` in `src/app` (except layout/theme wiring from bootstrap).
2. **No raw `<input className="…">`** in features — use `Input`.
3. **Status messages** use `Alert` with the right `variant`.
4. **Icons:** prefer defaults on `Alert`; for custom UI, `@heroicons/react/24/outline` or `/24/solid` as in primitives.
5. **Dark mode:** use paired `dark:` classes with semantic tokens, not separate hard-coded palettes.
