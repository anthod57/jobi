# Shared: verify / audit (security, perf, WCAG)

Run during **`/wf-verify-work`**, before **`/wf-ship`**, or when a phase **UAT** names an audit. Use commands from `.wf/project.yml`; if a key is missing, run the **default** below once and add the key to `project.yml`.

Record in chat: **command → pass/fail → one line** (no full log dump unless fail).

---

## 1. Dependencies & known CVEs

**When:** every milestone ship; any phase that added/updated `package.json` lockfile.

| Package manager | Command |
|-----------------|--------|
| npm | `npm audit --audit-level=high` |
| npm (JSON) | `npm audit --json > .wf/cache/audit.json` (only on fail, for summary) |
| pnpm | `pnpm audit --audit-level high` |
| yarn | `yarn npm audit --severity high` |

**Pass:** no high/critical (or project threshold in PROJECT.md).  
**Fail:** create todo `fix: bump or replace <package> (CVE-…)` — do not mark phase/milestone done.

Optional deeper (if installed): `npx osv-scanner -r .`

---

## 2. Secrets in repo

**When:** ship; any phase touching auth, `.env.example`, CI workflows.

```powershell
# if gitleaks installed
gitleaks detect --source . --no-git -v
```

Default without gitleaks:

- `git grep -E "(AKIA|API_KEY|SECRET|PRIVATE KEY|-----BEGIN)" -- ':!*.md' ':!.wf/cache'` → must be empty (or only examples in `.env.example` with placeholders).

**Pass:** no real secrets in tracked files.

---

## 3. Security smoke (app)

**When:** phase `role: api|web` and UAT touches auth, forms, or PII.

Checklist (manual or e2e):

- [ ] Unauthenticated call to protected route → **401/403**, not 500 or data leak
- [ ] Wrong role → deny
- [ ] Invalid/expired token → deny
- [ ] Error body: no stack trace, no SQL, no internal paths to client
- [ ] `Set-Cookie`: `HttpOnly` + `Secure` in production pattern (if cookies used)
- [ ] CORS: not `*` with credentials (spot-check Network tab or test)

API quick probe (replace URL):

```bash
curl -s -o /dev/null -w "%{http_code}" https://localhost:3000/api/protected
# expect 401 without cookie
```

---

## 4. WCAG 2.2 AA (UI)

**When:** phase `role: web` or UAT lists a screen/route.

### Automated (pick one the project supports)

```bash
# Playwright + axe (preferred if e2e exists)
npx playwright test --grep @a11y

# axe CLI against running app (set BASE_URL)
npx @axe-core/cli http://localhost:3000/login

# Lighthouse CI (accessibility score only)
npx lighthouse http://localhost:3000 --only-categories=accessibility --quiet --output=json --output-path=.wf/cache/lighthouse-a11y.json
```

**Pass:** zero serious/critical axe violations; or Lighthouse a11y ≥ 90 (tune in PROJECT.md).

**DS consistency (web):** spot-check changed files — no new raw `#` colors / arbitrary Tailwind; imports from PROJECT § Design system paths only (`shared-design-system.md`).

### Manual spot (5 min — required if no axe in CI)

One route per UAT screen:

- [ ] Tab through all controls; focus visible
- [ ] Form: label + error linked (`aria-describedby` or visible text)
- [ ] Page `<title>` updates on navigation (SPA)
- [ ] Images: `alt` present or decorative `alt=""`
- [ ] Zoom 200%: no horizontal scroll on main content

Add `eslint` if project has it: `npm run lint` (includes `eslint-plugin-jsx-a11y` when configured).

---

## 5. Performance (lightweight)

**When:** ship or phase that added heavy UI/API list endpoints.

```bash
# build budget
npm run build

# optional bundle size (if script exists)
npm run analyze
```

**Web — Lighthouse performance (local)**

```bash
npx lighthouse http://localhost:3000 --only-categories=performance --quiet --output=json --output-path=.wf/cache/lighthouse-perf.json
```

**Pass (defaults — override in PROJECT.md):**

- `npm run build` exits 0
- Lighthouse performance ≥ 50 on dev build (staging/prod stricter)
- List endpoints: pagination or cap documented in Contract; no unbounded `SELECT *` in new code (grep `findMany` without `take`/`limit` when ORM)

**API — quick sanity**

- List route returns in &lt; 500ms on seed data (manual or one perf test if todo names it)

---

## 6. Lint & types (gate)

**When:** every verify before `done`.

From `.wf/project.yml`:

```bash
npm run lint
npm run test
# if TypeScript:
npx tsc --noEmit
```

Quiet on success; on fail → one failing rule + file.

---

## 7. Milestone ship bundle

Before **`/wf-ship`**, run in order (stop on fail):

1. `wflow integrity`
2. `npm audit` (or `project.yml` `audit:`)
3. `npm run lint` / `test` / `e2e` if milestone touched UI
4. WCAG block **if** any web phase in milestone
5. Secrets grep / gitleaks **if** auth or env touched

Note results in PR body as checklist (pass/fail per line).

---

## 8. `project.yml` keys (optional)

```yaml
test: npm test
e2e: npm run e2e
lint: npm run lint
typecheck: npx tsc --noEmit
audit: npm audit --audit-level=high
a11y: npx @axe-core/cli http://localhost:3000
perf: npx lighthouse http://localhost:3000 --only-categories=performance --quiet
```

Executor/QA runs the value verbatim when UAT says “run audit” or “run a11y”.
