---
id: M1-01
phase: 1
role: web
status: done
branch: feat/m1-01-scaffold
needs: []
---
# Next.js app scaffold

## Decisions

- Greenfield repo root; single Next.js app (not monorepo).
- **Next.js** App Router, **TypeScript**, package manager **npm**.
- Layout per `PROJECT.md` § Codebase layout: `src/app/`, `src/components/`, `src/lib/`, alias `@/` → `src/`.
- **Tailwind CSS** in scaffold; **Flowbite React** waits for **M2** (no DS primitives in this phase).
- Dev script `npm run dev`; production build `npm run build` + `npm run start`.
- **`next.config.ts`**: `output: "standalone"` (required by M1-02 Dockerfile).

## Contract

Bootstrap at repo root (when phase executes):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack
```

Minimum follow-up files/paths (executor adds if CLI omits):

| Path | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout, `lang="fr"`, minimal metadata title **Jobi** |
| `src/app/page.tsx` | Placeholder replaced in M1-03 |
| `.gitignore` | Must include `.env*.local`, `node_modules/`, `.next/` |

No `src/server/` until a later milestone needs it.

**`next.config.ts`** must include:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

## Todos

- [x] Run `npx create-next-app@latest .` at repo root with Contract flags — `package.json`, `src/app/`, Tailwind, ESLint, `@/*` alias present
- [x] Add `next.config.ts` exactly as Contract (`output: "standalone"`)
- [x] Update `src/app/layout.tsx`: root `<html lang="fr">`, metadata title **Jobi**
- [x] Confirm `.gitignore` lists `.env*.local`, `node_modules/`, `.next/`
- [x] Add `src/components/` and `src/lib/` (empty `.gitkeep` if dirs missing) per `.wf/PROJECT.md` codebase layout
- [x] Test: `npm run build` succeeds and `.next/standalone/server.js` exists

## UAT

- [x] `npm run dev` → http://localhost:3000 loads without error (default Next starter page OK)
- [x] `npm run build` && `npm run start` → http://localhost:3000 responds
- [x] Page source shows `<html lang="fr">` and document title **Jobi**
- [x] `npm audit --audit-level=high` — pass (shared-audit §1)
