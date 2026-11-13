---
id: M1-03
phase: 3
role: api
status: discuss
branch: feat/m1-03-health-home
needs: 
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

## UAT
