# Role: API / backend

When the phase touches PII, auth, or public UI, also read `.wf/roles/shared-compliance.md`.

Always read `.wf/roles/shared-maintainability.md` — structure, naming, and human-readable code.

## Scope

- Implement only todos in the phase file; no repo-wide refactors.
- One todo = one atomic commit; Conventional Commits with phase id prefix.
- Match existing routes, DI, logging, and error response shape.

## Input & contracts

- Validate all external input at the boundary (Zod, class-validator, etc.).
- Reject unknown fields when the stack supports strict schemas.
- Apply `## Contract` verbatim; do not redesign schema or payload shapes.
- OpenAPI: update only if the project already publishes it; keep in sync with code.

## Security

- **AuthN/AuthZ on every mutating and sensitive read** — no “temporary” public admin routes.
- **Least privilege** — DB users, API keys, and IAM scoped to what the todo needs.
- Parameterized queries / ORM only; no string-concatenated SQL.
- Hash passwords with Argon2id or bcrypt (project standard); never log credentials or tokens.
- Rate-limit auth, password reset, and token issuance endpoints when the stack allows.
- CORS: explicit allowlist; no `*` with credentials.
- Set security headers at the edge or framework layer when this role owns HTTP config.
- Dependency patches: do not add packages with known critical CVEs without user approval.

## Privacy & GDPR (when processing personal data)

- Collect **minimum** data; tie each field to a documented purpose (phase Decisions).
- Lawful basis and retention period must be recorded in Decisions before persisting PII.
- Support **data subject rights** in scope of the feature: access, rectification, erasure, export where applicable.
- Do not log emails, names, IPs, or tokens in application logs; use opaque ids in logs.
- Encryption in transit (TLS) is assumed; at-rest encryption follows cloud/DB project settings.
- Data residency / subprocessors: flag in Decisions if the todo touches cross-border transfer.
- DPIA-level risk: if processing special-category or large-scale monitoring, stop and note in phase (do not silently implement).

## Performance & reliability

- Avoid N+1 queries; batch or eager-load where the ORM supports it.
- Pagination for list endpoints; cap page size server-side.
- Timeouts on outbound HTTP and DB calls; fail fast with stable error codes.
- Idempotent handlers for webhooks/retries where the Contract requires it.
- Cache only with explicit TTL and cache-key rules; never cache per-user secrets.

## Errors & observability

- Stable machine-readable error codes + safe user-facing messages (no stack traces to clients).
- Log structured events (request id, actor id hash) — not raw bodies containing PII.
- JSDoc only for non-obvious *why*; types live in TypeScript.

## Testing

- **Feature = test d’abord:** nouveau endpoint/handler → todo `Test: …test.ts` rouge, puis impl → vert avant todo check.
- Red → green → refactor ; pas d’impl métier sans spec qui échoue d’abord (sauf copie Contract sans branche nouvelle).
- Cover auth failure, validation failure, and happy path at minimum for new endpoints.
