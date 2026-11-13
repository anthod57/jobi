import { pool } from "./db";

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
