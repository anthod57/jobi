# Role: Web / frontend

Read `.wf/roles/shared-compliance.md` for shared privacy/security/a11y baseline.

Always read `.wf/roles/shared-maintainability.md` — feature folders, component naming, colocation.

**Mandatory:** `.wf/roles/shared-design-system.md` — use the project DS only; no one-off styling.

## Scope

- Touch only files named in todos; match components, styling, and state patterns in the repo.
- One todo = one atomic commit; Conventional Commits with phase id prefix.
- E2E: use runner from `.wf/project.yml` (`e2e` key) when todos require it.

## UX & quality

- Preserve loading, empty, and error states for every async action (DS skeleton/spinner).
- Destructive actions require confirmation; use DS `Dialog` / alert pattern from PROJECT.md.
- **Design system is not optional** — see `shared-design-system.md`.

## Accessibility (WCAG 2.2 AA target)

- **Semantic HTML** — correct landmarks, headings in order, lists, tables for data.
- **Keyboard** — full operability without mouse; visible `:focus-visible` styles.
- **Forms** — every control has a `<label>` or `aria-label`; errors linked via `aria-describedby`.
- **Color** — contrast ≥ 4.5:1 normal text, 3:1 large UI; do not rely on color alone.
- **Motion** — respect `prefers-reduced-motion`; avoid essential info only in animation.
- **Images & icons** — meaningful `alt`; decorative `alt=""`; icon-only buttons have accessible name.
- **Live regions** — use `aria-live` for toasts/async status when content updates without focus move.
- **Skip link** and logical tab order on new layouts.
- Do not disable zoom; avoid `user-scalable=no`.
- Run axe or project a11y lint if configured before marking UI todos done.

## Security (frontend)

- No secrets in client bundles (API keys, private tokens).
- Prefer httpOnly, Secure, SameSite cookies for session when backend owns auth.
- Sanitize user HTML only with an approved library; default is escape, not `dangerouslySetInnerHTML`.
- CSP and trusted types follow project config; do not weaken for convenience.
- Validate links (`rel="noopener noreferrer"` on external `target="_blank"`).

## Privacy & GDPR (UI)

- Clear purpose text on forms that collect PII; link to privacy notice when the app has one.
- Consent checkboxes **unchecked by default** where consent is required (not for strictly necessary processing).
- “Delete my account” / export entry points only when in phase scope.
- No analytics or third-party embeds unless listed in Decisions and consent flow exists.
- Cookie banner / preference storage only if the project already uses that pattern.

## Performance

- Code-split routes or heavy widgets when the stack supports it and the todo adds significant JS.
- Optimize images (dimensions, modern formats, lazy below fold).
- Avoid layout shift: reserve space for images and async content.
- Debounce search/filter inputs; virtualize long lists when todo implies large datasets.

## Testing

- Unit/component tests for logic and a11y-critical markup when todos name test files.
- E2E for critical user paths named in UAT (login, submit, error recovery).
