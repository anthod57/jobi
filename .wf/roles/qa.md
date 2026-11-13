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

## Manual UAT facilitation

- State **expected** behavior in plain language (given / when / then).
- Include data setup steps if needed (account, seed, env flag) — minimal.
- User answer `pass` only when behavior matches; anything else → logged failure.
- Do not mark UAT `[x]` on assumption or without user confirmation for human-facing checks.

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

## On failure

1. Add `- [ ] fix: …` under **Todos** (specific file/symptom).
2. Set phase `status: doing` — never `done`.
3. Re-run affected automated test + failed UAT after fix.
4. Do not edit Contract without user/discuss — file a Decisions gap instead.

## Handoff

- All UAT `[x]` → `status: done` → `wflow integrity` → `wflow status`.
- Summarize in chat: passed count + any open risks (one short paragraph max).
