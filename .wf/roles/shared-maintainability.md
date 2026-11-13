# Shared: maintainable code & project structure

Apply on **every** execute phase and record layout choices in **Discuss / PROJECT** before large file trees appear.

## Code — readable for the next human

- **Names explain intent** — `createMagicLinkToken`, not `doAuth` or `handleStuff`.
- **Small units** — one clear job per function/module; extract when a block needs a comment to explain *what* it does.
- **Comments explain why** — not what the code already says; document non-obvious business rules and invariants.
- **No drive-by refactors** — only touch files named in todos; leave unrelated code as-is.
- **Consistent style** — match the repo (formatter/linter); do not introduce a second pattern.
- **Types are documentation** — explicit TypeScript types; JSDoc only where types cannot express intent (e.g. thrown errors, side effects).
- **Errors** — typed or enumerated failures; messages actionable for devs, safe for users.
- **Dependencies** — prefer stdlib/stack defaults; new package only when todo or Decisions allow it.
- **Dead code** — remove code you replace; no large commented-out blocks.

## Project structure — easy to navigate

**Default mental model (adapt to stack in PROJECT.md):**

```text
src/
  features/<name>/     # vertical slice: UI + logic + types for one capability
    ...
  shared/              # cross-feature only (dates, ids, http client, ui primitives)
  lib/ or server/      # entry, wiring, config (framework-specific)
tests/                 # or colocated *.test.ts next to source — pick one; stay consistent
```

**Rules**

| Do | Avoid |
|----|--------|
| Colocate feature code (change auth in one folder) | Giant `utils/` dumping ground |
| Mirror domain language in folder names | `helpers`, `misc`, `stuff` |
| One obvious entry per app (`main`, `app`, `index`) | Many equally named `index.ts` re-export layers |
| `README.md` at repo root + short `ARCHITECTURE.md` when brownfield | Tribal knowledge only in chat |
| Public API surface explicit (barrel only at feature boundary) | Deep re-export chains |
| Config in one place (`config/`, env schema) | Scattered `process.env` reads |

**Brownfield**

- **Extend existing layout** — do not reorganize the whole repo in a feature phase.
- New code follows the **nearest neighbor** (copy the closest existing feature).
- If layout is unclear, add a todo: “Document folder rule in PROJECT.md § Codebase layout” before mass file creation.

## Planning (PM / Discuss)

Lock in **PROJECT.md → Codebase layout**:

- Monorepo or single package
- Feature-sliced vs layered (`controllers/`, `services/`)
- Where tests live
- Naming conventions (files, components, API routes)

Phase **Decisions** cite paths: “Auth API lives under `src/features/auth/`”.

## Phase todos

- Prefer todos that name **full paths** under the agreed layout.
- “Add migration” and “add route” in separate todos if they are separate commits.

## Review bar before `done`

- A new teammate can find the feature in **&lt; 2 minutes** with `README` + folder name.
- No new top-level folders without a Decisions line.
- `wflow integrity` green; tests name the behavior from UAT.
