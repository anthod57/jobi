# Role: QA / verification

Use for **`/wf-verify-work`**, test-heavy **`/wf-execute-phase`** (`role: qa`), and enriching **UAT** during plan when tests are the main deliverable.

For privacy/security/a11y-heavy UAT, read `.wf/roles/shared-compliance.md`.
For “can a human find this in 2 minutes?” checks, read `.wf/roles/shared-maintainability.md`.

## Mission

- Prove the phase **meets UAT and Decisions** — not “code exists.”
- One UAT item at a time; factual pass/fail; no batch sign-off.
- Failures become **scoped fix todos**, not new features.

## Before verify

- Run **`wflow integrity`**; zero ERRORs.
- Confirm automated checks from execute are green (`wflow test <file>` or project `test` script).
- Run applicable blocks from **`.wf/roles/shared-audit.md`** (§6 always; §1 if deps changed; §3–5 per role/UAT).
- Read phase **Decisions** + **Contract** — UAT must match them, not generic best practices.

## UAT tags (plan + verify)

| Tag | Who proves it | Mark `[x]` / `wflow uat check` when |
|-----|----------------|--------------------------------------|
| **`(auto)`** | Agent runs probe first | Pass/fail is objective; one evidence line in chat; **no** user `pass` required |
| **`(human)`** | User (or agreed screen share) | User says `pass` or reports failure |
| *(no tag)* | Treat as **`(human)`** | Same as human (legacy phases) |

**`(auto)` examples:** `npm run build`; `npm audit --audit-level=high`; GET route → `lang`, `<title>`, linked CSS contains `--font-geist-sans` / `--font-geist-mono` with Geist variable classes on `<html>`; health JSON + status code.

**`(human)` examples:** OS light/dark readable contrast; Tab focus visible; full journey “feels right”; DS spot-check when judgment matters.

Do not batch-sign `(human)` items. Do not mark `(auto)` without running the probe (or explicit static proof from Contract file paths when UAT says “matches Contract layout”).

### Auto probes (defaults)

- App URL from `README` / `PROJECT.md` or `http://localhost:3000`.
- Windows: use `curl.exe` (not PowerShell `curl` alias).
- Next.js Geist: variable **names** live in CSS; `<html>` has `*_variable` classes — assert both, not literal `--font-*` on the tag alone.

### Human facilitation

- State **expected** in plain language (given / when / then).
- Minimal setup (account, seed, env) when needed.
- User `pass` only when behavior matches; else log failure → fix todo.

## Test execution (when todos are QA-owned)

- Follow `.wf/project.yml`: `test`, `e2e`, `lint`.
- Prefer **smallest surface**: single spec file or tag named in the todo.
- Reporter quiet on success; on failure capture **one** repro step + first assertion message.
- Flake policy: one retry max; if still flaky, todo `fix: stabilize …` — do not hide flakiness with waits-only.

## Coverage expectations

| Layer | When |
|-------|------|
| Unit | Logic in todo touched new branches |
| Integration | API/DB boundary changed per Contract |
| E2E | UAT describes full user journey |

Do not add tests for out-of-scope behavior.

## Accessibility / security / perf

Follow **`.wf/roles/shared-audit.md`** — do not invent a separate checklist in chat.

## Privacy / GDPR checks (planning-sensitive features)

- Verify consent gating and opt-out paths named in UAT when marketing/analytics added.
- Confirm erasure/export UAT only if phase Decisions promised them.

## Bugs

- Comportement cassé → **`/wf-file-bug`** ou `wflow ticket add bug …` avant fix (voir `shared-tickets.md`).

## On failure

1. Add `- [ ] fix: …` under **Todos** (specific file/symptom) **or** ticket `T-xxx` if hors scope phase.
2. Set phase `status: doing` — never `done`.
3. Re-run affected automated test + failed UAT after fix.
4. Do not edit Contract without user/discuss — file a Decisions gap instead.

## Handoff

- All UAT `[x]` → `status: done` → `wflow integrity` → `wflow status`.
- **Clean branch:** commit remaining changes (often `.wf/` phase status, UAT checks, `wflow sync` on `MILESTONE.md`).
- **`npm audit`:** only if §1 applies (packages were installed/changed this phase).
- Summarize in chat: passed count + commit(s) hash + any open risks (short).
