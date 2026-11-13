# Shared compliance (all roles)

Read this section when the phase touches **PII**, **auth**, or **public UI**.

## GDPR / privacy

- **Data minimization** — each field has a stated purpose in phase Decisions.
- **Lawful basis & retention** documented before storing personal data.
- **DSAR** paths (access/erase/export) only when Decisions promise them.
- **No PII in logs** (email, name, IP, tokens); use opaque ids.
- **Subprocessors** (hosted DB, email, analytics) listed in PROJECT or Decisions.
- **Consent** opt-in by default for non-essential processing; necessary cookies only without banner when legally valid.

## Security baseline

- **Least privilege** for creds, DB roles, IAM, API keys.
- **Secrets** in env/secret manager only — never committed.
- **TLS** for data in transit; at-rest per platform standard.
- **Input validation** at trust boundaries; parameterized SQL.
- **Rate limits** on auth and account-recovery flows when applicable.

## Accessibility (public UI)

- Target **WCAG 2.2 AA**: keyboard, focus visible, labels, contrast, no color-only state.
- Respect **`prefers-reduced-motion`**.

## When uncertain

- Stop implementation; add an **Open question** in Decisions or a PM todo — do not guess on legal or crypto choices.
