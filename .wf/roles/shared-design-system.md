# Shared: design system (frontend — mandatory)

**No exception:** web phases use only the project design system documented in **`PROJECT.md` → Design system** and existing UI primitives. If something is missing, **stop** — add a todo or discuss decision; do not ship one-off UI.

## Must exist in PROJECT.md (filled at `/wf-setup` or before first `role: web` phase)

| Field | Example |
|-------|---------|
| Component library path | `src/components/ui/`, `@acme/ui` |
| Tokens | `src/styles/tokens.css`, Tailwind `theme.extend` in `tailwind.config` |
| Typography | scale names (`text-body`, `heading-1`) — no ad-hoc `text-[13px]` |
| Color | semantic only (`primary`, `danger`, `surface`) — no raw `#hex` in feature code |
| Icons | single set (`lucide-react`, MUI icons) |
| Reference doc | link to Storybook, Figma, or `docs/design-system.md` |

Greenfield without a DS yet: **first web milestone phase** = create tokens + core primitives (Button, Input, Label, Card, Alert) before feature screens.

## Rules for `role: web` (execute)

1. **Import UI from documented paths only** — grep the repo for existing usage before creating a new component.
2. **No parallel patterns** — if MUI is the stack, do not add shadcn in the same screen; if Tailwind tokens exist, no inline `style={{ margin: 17 }}`.
3. **Compose, don’t clone** — wrap/extend DS components; new primitives only when approved in phase **Decisions**.
4. **States** — use DS variants for hover, focus, disabled, loading (spinner/skeleton from DS).
5. **Forms** — DS `Input`, `Label`, `FieldError`; same error color/token as DS.
6. **Layout** — DS `Stack`, `Grid`, or documented layout primitives; consistent page padding from tokens (`--space-page`, etc.).
7. **Dark mode** — if project supports it, use token pairs; no hard-coded light-only colors.

## Discuss / Contract (web phases)

In phase **Decisions**, list:

- Allowed components for this screen (by name/path)
- Any new primitive (rare) with token mapping
- Figma/node link if provided

In **Contract** (optional): snippet of import paths or component API props — not full implementations.

## Verify (UAT)

Add one UAT line when shipping UI:

- [ ] Screen uses only DS components/tokens (spot-check: no raw hex, no duplicate button styles)

Optional: Storybook/Chromatic if project has it.

## Forbidden without user approval

- New color/spacing outside tokens
- Copy-paste markup from old app branches that bypass DS
- Third-party UI kits in feature code
- `!important` to override DS
