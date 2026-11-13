---
id: M1-03
phase: 3
role: api
status: done
branch: feat/m1-03-health-home
needs: []
---
# Health API + welcome shell

## Decisions

- Dependency **`pg`** (+ **`@types/pg`**) for SQL ping; no ORM in M1.
- Shared probe in **`src/lib/health.ts`**; route handler reuses it.
- **`GET /api/health`**: JSON body always; **HTTP 200** if all checks ok, **503** if database fails.
- Home **`/`**: server-rendered welcome (French copy) showing DB status from `getHealthStatus()` (no client-only gate on first paint).
- UI: **Tailwind only** (no Flowbite until M2).
- French welcome title **Jobi**; subtitle explains local job-offer aggregator (one line).

## Contract

**`src/lib/db.ts`**

```typescript
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({ connectionString });
```

**`src/lib/health.ts`**

```typescript
export type HealthCheckName = "app" | "database";

export type HealthResponse = {
  status: "ok" | "degraded";
  checks: Record<HealthCheckName, "ok" | "error">;
  timestamp: string;
};

export async function getHealthStatus(): Promise<{
  body: HealthResponse;
  httpStatus: 200 | 503;
}> {
  const checks: HealthResponse["checks"] = { app: "ok", database: "error" };
  try {
    await pool.query("SELECT 1");
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }
  const status = checks.database === "ok" ? "ok" : "degraded";
  return {
    body: {
      status,
      checks,
      timestamp: new Date().toISOString(),
    },
    httpStatus: status === "ok" ? 200 : 503,
  };
}
```

(Executor imports `pool` from `./db`.)

**`src/app/api/health/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { getHealthStatus } from "@/lib/health";

export async function GET() {
  const { body, httpStatus } = await getHealthStatus();
  return NextResponse.json(body, { status: httpStatus });
}
```

**`src/app/page.tsx`** — minimum visible content:

- Heading: `Jobi`
- Paragraph: `Agrégateur d’offres d’emploi — instance locale.`
- Status line: `Base de données : OK` or `Base de données : indisponible` from `getHealthStatus()`.

## Todos

- [x] Add `pg` and `@types/pg` via npm — `package.json` and lockfile list both
- [x] Add `src/lib/db.ts` exactly as Contract (`Pool`, `DATABASE_URL` guard)
- [x] Add `src/lib/health.ts` exactly as Contract (`getHealthStatus`, import `pool` from `./db`)
- [x] Add `src/app/api/health/route.ts` exactly as Contract (`GET` → JSON + 200/503)
- [x] Replace `src/app/page.tsx` per Contract (heading **Jobi**, French subtitle, DB status from `getHealthStatus()` server-side)
- [x] Test: `DATABASE_URL` set and `db` reachable → `npm run build` succeeds
- [x] Test: `db` up → `curl -sf http://localhost:3000/api/health` exits 0; body has `"status":"ok"` and `checks.database` **ok**

## UAT

- [x] Copy `.env.example` → `.env`; `docker compose up --build -d` — `docker compose ps` shows **db** and **app** healthy
- [x] Browser http://localhost:3000 — heading **Jobi**, line *Agrégateur d’offres d’emploi — instance locale.*, status **Base de données : OK** with full stack up
- [x] http://localhost:3000/api/health — JSON `status` **ok**, `checks.database` **ok**, HTTP **200**
- [x] Stop `db` only (`docker compose stop db`); refresh `/` — **Base de données : indisponible**; `/api/health` returns HTTP **503** and `status` **degraded**
- [x] `npm audit --audit-level=high` — pass (shared-audit §1)
