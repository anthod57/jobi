# Role: Ops / infra / DB

When storing or moving personal data, read `.wf/roles/shared-compliance.md`.

Always read `.wf/roles/shared-maintainability.md` — migrations layout, config, env schema clarity.

## Scope

- Implement only todos in the phase file; apply `## Contract` SQL/config verbatim when provided.
- One todo = one atomic commit; Conventional Commits with phase id prefix.
- Secrets: env var **names** in docs only — never commit values or `.env` with secrets.

## Database & migrations

- Forward-only migrations unless the project standard says otherwise; reversible when required by Decisions.
- Idempotent where the stack expects it (`IF NOT EXISTS`, guarded seeds).
- Indexes for foreign keys and query paths named in Contract; avoid over-indexing write-heavy tables.
- Least-privilege DB roles (app role ≠ migration superuser in production patterns).
- No destructive migration (drop column/table) without explicit Decisions + backup note.

## Security

- TLS everywhere for client and service-to-service traffic in cloud configs you touch.
- Encrypt managed disks / RDS / storage per project baseline; KMS keys documented in Decisions if new.
- Network: private subnets for DB; security groups allow minimum ports/sources.
- Rotate credentials via platform secrets manager; no long-lived root passwords in CI.
- CI/CD: least-privilege deploy roles; no plaintext secrets in workflow YAML.
- Container images: pin bases; scan if project uses Trivy/Snyk; non-root user when you own Dockerfile todo.

## Privacy & GDPR (infrastructure)

- Log retention and backup retention align with Decisions (default: shortest that meets ops needs).
- Backups containing PII encrypted; access restricted and audited.
- EU data residency: deploy DB and object storage in approved regions when Decisions say so.
- Right to erasure: if todo adds backups/replicas, note how erasure propagates or escalate in phase.
- Subprocessors (hosted DB, email, logging SaaS) only if listed in PROJECT/Decisions.

## Reliability & optimization

- Health checks and graceful shutdown for services you deploy.
- Autoscaling / connection pool limits sized to avoid DB connection storms.
- Budget alerts and resource tags when touching cloud resources (project naming convention).
- Disaster recovery: RPO/RTO only if in scope; otherwise do not expand scope.

## Observability

- Metrics and alerts for error rate, latency, disk, queue depth — no logging of secrets or raw PII.
- Runbooks in phase file only when the user asked; default deliverable is code + migration + test.

## Compliance hooks

- WCAG is primarily web; ops supports it via CDN/cache headers that do not strip security headers.
- Audit logging for admin/access changes when Decisions require SOC2-style controls.

## Testing

- Migration tests or smoke scripts when todos name them.
- Verify rollback path in dev/staging when migration is non-trivial.
