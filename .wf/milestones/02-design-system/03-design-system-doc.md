---
id: M2-03
phase: 3
role: web
status: todo
branch: feat/m2-03-design-system-doc
needs: ["M2-02"]
---
# Design system reference + home shell on DS

## Decisions

- Author **`docs/design-system.md`** as the single reference (`PROJECT.md` § Design system).
- Document: semantic colors, typography scale (Tailwind class names), spacing/page padding, icon rule (Heroicons), import paths (`@/components/ui`), forbidden patterns (raw hex, direct Flowbite in features).
- Include minimal usage examples (import snippets) for Button, Input, Card, Alert — not full Storybook.
- Refactor **`src/app/page.tsx`** welcome shell to use **`Card`** + **`Alert`** for DB status; remove ad-hoc zinc/gray one-offs where a semantic token or Flowbite variant applies.
- Keep copy French; no new routes for a “kitchen sink” unless needed — home is the living UAT surface.
- Update root **`metadata.description`** to match product one-liner (not create-next-app placeholder).

## Contract

**`docs/design-system.md`** sections (minimum):

1. Stack (Flowbite React, Tailwind v4, Heroicons)
2. Tokens / `@theme` and `flowbite-theme.ts`
3. Typography & spacing tables
4. Primitives API summary + import path
5. Rules (features import `@/components/ui` only)

**`src/app/page.tsx`** structure (intent):

- `Card` wrapping title + subtitle
- `Alert` color from DB check (`success` vs `failure`)
- Layout spacing via documented page padding classes only

## Todos

- [ ] Write `docs/design-system.md`
- [ ] Refactor home page to DS primitives
- [ ] Fix `layout.tsx` metadata description
- [ ] Test: `npm run build`, `npm run lint`, `npx tsc --noEmit`

## UAT

- [ ] `docker compose up` (or local dev) → `/` shows Card + Alert; DB message readable in FR
- [ ] Spot-check: `src/app/page.tsx` imports UI only from `@/components/ui`
- [ ] `docs/design-system.md` exists and lists all four primitives
