---
id: M1-02
phase: 2
role: ops
status: review
branch: feat/m1-02-compose
needs: 
---
# Docker Compose: app + SQL

## Decisions

- **PostgreSQL 16** (`postgres:16-alpine`) for service `db`.
- Two-service Compose: **`db`** + **`app`** (Next.js production image).
- **Day-to-day dev (chosen):** `docker compose up db -d` + host **`npm run dev`** with `DATABASE_URL` pointing at **`localhost:5432`** (port published on `db`).
- **M1 acceptance / prod-like smoke:** `docker compose up --build` (both services; app on host **3000**).
- Dev DB credentials in compose + `.env.example` only (local instance, not production hardening).
- Named volume **`jobi_pgdata`** → `/var/lib/postgresql/data`.
- App **`depends_on`** `db` with `condition: service_healthy`.
- Health route contract is **M1-03**; this phase only documents that `app` healthcheck targets `/api/health`.
- **M1-02 verify:** `db` healthy + `app` image builds and container starts; app Compose healthcheck turns green only after **M1-03** ships `GET /api/health`.
- **`.env.example`** committed; root `.gitignore` keeps `.env*` but adds **`!.env.example`**.

## Structure

| Path | Purpose |
|------|---------|
| `docker-compose.yml` | Services `db` + `app` |
| `Dockerfile` | Multi-stage Next standalone image |
| `.dockerignore` | Slim build context |
| `.env.example` | Committed template (copy to `.env` locally) |

## Contract

**`.env.example`** (committed):

```env
# Copy to .env — local Docker only
POSTGRES_USER=jobi
POSTGRES_PASSWORD=jobi
POSTGRES_DB=jobi
DATABASE_URL=postgresql://jobi:jobi@db:5432/jobi
```

For **host-side** `npm run dev` (optional later): `DATABASE_URL=postgresql://jobi:jobi@localhost:5432/jobi` when `db` publishes **5432:5432**.

**`docker-compose.yml`** — minimum shape:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-jobi}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-jobi}
      POSTGRES_DB: ${POSTGRES_DB:-jobi}
    volumes:
      - jobi_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 5
    ports:
      - "5432:5432"
    restart: unless-stopped

  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL:-postgresql://jobi:jobi@db:5432/jobi}
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://127.0.0.1:3000/api/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped

volumes:
  jobi_pgdata:
```

**`Dockerfile`** — minimum shape:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

**`.dockerignore`** (minimum):

```
.git
.wf
node_modules
.next
npm-debug.log*
Dockerfile
docker-compose.yml
.env*
!.env.example
```

**`.gitignore`** — after existing `.env*` block, add:

```
!.env.example
```

(Standalone `output` is **M1-01** — do not change `next.config.ts` here except if missing.)

## Todos

- [x] Add `.env.example` at repo root exactly as Contract (local Docker creds + `DATABASE_URL` host `db`)
- [x] Add `docker-compose.yml` at repo root exactly as Contract (`db` postgres:16-alpine, `app` build, `jobi_pgdata`, healthchecks, `depends_on` healthy)
- [x] Add `Dockerfile` at repo root exactly as Contract (node:22-alpine deps/builder/runner, standalone artifacts, `curl` in runner)
- [x] Add `.dockerignore` at repo root exactly as Contract
- [x] Patch `.gitignore`: after `.env*` rule, add `!.env.example` per Contract
- [x] Confirm `next.config.ts` has `output: "standalone"`; add only if missing (M1-01 Contract — no other `next.config` edits)
- [x] Test: `docker compose build app` completes successfully from clean context
- [x] Test: `docker compose up db -d` then `docker compose ps` shows `db` **healthy**

## UAT

- [ ] Copy `.env.example` to `.env`; run `docker compose up db -d` — `docker compose ps` shows `db` **healthy** and port **5432** published on host
- [ ] Run `docker compose up --build -d` (both services) — `docker compose ps` shows `app` **Up** (running); image build finishes without error
- [ ] `app` Compose healthcheck may stay **unhealthy** until M1-03 ships `GET /api/health` — expected; note status if verifying manually
- [ ] Optional dev path: with only `db` up, `npm run dev` on host works when `DATABASE_URL` uses `localhost:5432` (no requirement to change app code this phase)
