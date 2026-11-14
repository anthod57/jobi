import { and, desc, eq, gt, inArray, isNotNull } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import { ingestionRuns } from "@/server/db/schema";

import { fetchAdzunaOffers } from "./clients/adzuna";
import { fetchFranceTravailOffers } from "./clients/france-travail";
import {
  getDecryptedCredential,
  type AdzunaCredentials,
  type FranceTravailCredentials,
} from "./credentials-repository";
import {
  upsertOfferWithSource,
  type NormalizedOfferInput,
  type OfferSource,
} from "./offer-repository";
import { buildSearchQueryFromProfile } from "./search-query";
import { recomputeScoresForOfferIds } from "@/lib/scoring/score-repository";

export type IngestionRunSummary = {
  id: number;
  source: "france_travail" | "adzuna";
  status: "running" | "success" | "partial" | "error";
  fetchedCount: number;
  insertedCount: number;
  updatedCount: number;
  dedupedCount: number;
  errorMessage: string | null;
  startedAt: Date;
  finishedAt: Date | null;
};

const LOCK_WINDOW_MS = 15 * 60 * 1000;
const INITIAL_MAX_DAYS_OLD = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_SOURCES: OfferSource[] = ["france_travail", "adzuna"];

async function computeMaxDaysOld(source: OfferSource): Promise<number> {
  const db = getDb();
  const [lastRun] = await db
    .select({ finishedAt: ingestionRuns.finishedAt })
    .from(ingestionRuns)
    .where(
      and(
        eq(ingestionRuns.source, source),
        inArray(ingestionRuns.status, ["success", "partial"]),
        isNotNull(ingestionRuns.finishedAt),
      ),
    )
    .orderBy(desc(ingestionRuns.finishedAt))
    .limit(1);

  if (!lastRun?.finishedAt) {
    return INITIAL_MAX_DAYS_OLD;
  }

  const elapsedDays = Math.ceil(
    (Date.now() - lastRun.finishedAt.getTime()) / MS_PER_DAY,
  );
  return Math.max(1, elapsedDays);
}

async function fetchOffersForSource(
  source: OfferSource,
  maxDaysOld: number,
): Promise<NormalizedOfferInput[] | null> {
  if (source === "france_travail") {
    const creds =
      await getDecryptedCredential<FranceTravailCredentials>("france_travail");
    if (!creds) return null;
    const query = await buildSearchQueryFromProfile({ maxDaysOld });
    return fetchFranceTravailOffers(creds, query);
  }

  const creds = await getDecryptedCredential<AdzunaCredentials>("adzuna");
  if (!creds) return null;
  const query = await buildSearchQueryFromProfile({ maxDaysOld });
  return fetchAdzunaOffers(creds, query);
}

async function syncSingleSource(
  source: OfferSource,
): Promise<IngestionRunSummary | null> {
  const db = getDb();
  const maxDaysOld = await computeMaxDaysOld(source);

  const credsCheck = await getDecryptedCredential(source);
  if (!credsCheck) {
    return null;
  }

  const [runRow] = await db
    .insert(ingestionRuns)
    .values({
      source,
      status: "running",
      startedAt: new Date(),
    })
    .returning();

  let fetchedCount = 0;
  let insertedCount = 0;
  let updatedCount = 0;
  let dedupedCount = 0;
  let failedOffers = 0;
  let errorMessage: string | null = null;
  let status: IngestionRunSummary["status"] = "success";

  try {
    const offers = (await fetchOffersForSource(source, maxDaysOld)) ?? [];
    fetchedCount = offers.length;
    const touchedOfferIds = new Set<number>();

    for (const offer of offers) {
      try {
        const { offerId, outcome } = await upsertOfferWithSource(offer);
        if (outcome === "inserted") {
          insertedCount += 1;
          touchedOfferIds.add(offerId);
        } else if (outcome === "updated") {
          updatedCount += 1;
          touchedOfferIds.add(offerId);
        } else {
          dedupedCount += 1;
        }
      } catch (err) {
        failedOffers += 1;
        if (!errorMessage) {
          errorMessage = err instanceof Error ? err.message : "Offer upsert failed";
        }
      }
    }

    if (touchedOfferIds.size > 0) {
      await recomputeScoresForOfferIds([...touchedOfferIds]);
    }

    if (failedOffers > 0) {
      status = "partial";
    }
  } catch (err) {
    status = "error";
    errorMessage = err instanceof Error ? err.message : "Ingestion sync failed";
  }

  const [updated] = await db
    .update(ingestionRuns)
    .set({
      status,
      fetchedCount,
      insertedCount,
      updatedCount,
      dedupedCount,
      errorMessage,
      finishedAt: new Date(),
    })
    .where(eq(ingestionRuns.id, runRow.id))
    .returning();

  return updated;
}

/** Orchestrates incremental ingestion across configured job-offer sources. */
export async function runIngestionSync(options?: {
  sources?: ("france_travail" | "adzuna")[];
  trigger?: "manual" | "cron";
}): Promise<{ runs: IngestionRunSummary[]; skippedReason?: string }> {
  const db = getDb();
  const lockCutoff = new Date(Date.now() - LOCK_WINDOW_MS);

  const [activeRun] = await db
    .select({ id: ingestionRuns.id })
    .from(ingestionRuns)
    .where(
      and(
        eq(ingestionRuns.status, "running"),
        gt(ingestionRuns.startedAt, lockCutoff),
      ),
    )
    .limit(1);

  if (activeRun) {
    return { runs: [], skippedReason: "already_running" };
  }

  const sources = options?.sources?.length ? options.sources : DEFAULT_SOURCES;
  const runs: IngestionRunSummary[] = [];

  for (const source of sources) {
    const summary = await syncSingleSource(source);
    if (summary) {
      runs.push(summary);
    }
  }

  return { runs };
}

/** Lists the most recent ingestion runs ordered by start time descending. */
export async function listRecentIngestionRuns(
  limit = 20,
): Promise<IngestionRunSummary[]> {
  const safeLimit = Math.min(Math.max(1, Math.trunc(limit)), 100);
  const db = getDb();

  return db
    .select()
    .from(ingestionRuns)
    .orderBy(desc(ingestionRuns.startedAt))
    .limit(safeLimit);
}
