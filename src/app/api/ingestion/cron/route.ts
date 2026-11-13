import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import {
  getDecryptedCredential,
  type IngestionCronConfig,
} from "@/lib/ingestion/credentials-repository";
import {
  listRecentIngestionRuns,
  runIngestionSync,
} from "@/lib/ingestion/sync";

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;

  const provided = header.slice("Bearer ".length);
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");
  if (expectedBuf.length !== providedBuf.length) return false;

  return timingSafeEqual(expectedBuf, providedBuf);
}

/** Triggers scheduled ingestion when enabled and the configured interval has elapsed. */
export async function POST(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config =
    await getDecryptedCredential<IngestionCronConfig>("ingestion_cron");
  if (!config?.enabled) {
    return NextResponse.json({ executed: false, reason: "disabled" });
  }

  const intervalMs = Math.max(1, config.intervalHours) * 60 * 60 * 1000;
  const recentRuns = await listRecentIngestionRuns(10);
  const lastFinished = recentRuns.find((run) => run.finishedAt !== null);

  if (
    lastFinished?.finishedAt &&
    Date.now() - lastFinished.finishedAt.getTime() < intervalMs
  ) {
    return NextResponse.json({ executed: false, reason: "interval_not_elapsed" });
  }

  const { runs, skippedReason } = await runIngestionSync({ trigger: "cron" });
  if (skippedReason) {
    return NextResponse.json({ executed: false, reason: skippedReason });
  }

  return NextResponse.json({ executed: true, runs });
}
