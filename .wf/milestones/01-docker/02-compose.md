---
id: M1-02
phase: 2
role: ops
status: discuss
branch: feat/m1-02-compose
needs:
  - M1-01
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

**Next.js** must set `output: "standalone"` in `next.config.ts` (todo in execute, or prep in M1-01 if decided — add Decision note).

Decision add: **`next.config` includes `output: "standalone"`** for the Docker image (executor updates in M1-01 or M1-02).

## Todos

## UAT
