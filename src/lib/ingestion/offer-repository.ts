import { and, eq } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import { jobOffers, jobOfferSources } from "@/server/db/schema";

import { computeDedupKey } from "./dedup";

export type OfferSource = "france_travail" | "adzuna";
export type ContractType =
  | "cdi"
  | "cdd"
  | "alternance"
  | "freelance"
  | "interim"
  | "stage";
export type RemoteMode = "onsite" | "hybrid" | "remote" | "flexible";

export type NormalizedOfferInput = {
  source: OfferSource;
  externalId: string;
  url: string;
  title: string;
  company: string;
  locationLabel: string;
  department: string | null;
  contractType: ContractType | null;
  remoteMode: RemoteMode | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryText: string | null;
  description: string;
  publishedAt: Date | null;
  rawPayload: Record<string, unknown>;
};

export type UpsertOutcome = "inserted" | "updated" | "deduped";

function buildBackfillPatch(
  existing: {
    department: string | null;
    contractType: ContractType | null;
    remoteMode: RemoteMode | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryText: string | null;
    description: string;
    publishedAt: Date | null;
  },
  input: NormalizedOfferInput,
  now: Date,
): Record<string, unknown> {
  const patch: Record<string, unknown> = { lastSeenAt: now };
  if (!existing.department && input.department) patch.department = input.department;
  if (!existing.contractType && input.contractType) patch.contractType = input.contractType;
  if (!existing.remoteMode && input.remoteMode) patch.remoteMode = input.remoteMode;
  if (existing.salaryMin === null && input.salaryMin !== null) patch.salaryMin = input.salaryMin;
  if (existing.salaryMax === null && input.salaryMax !== null) patch.salaryMax = input.salaryMax;
  if (!existing.salaryText && input.salaryText) patch.salaryText = input.salaryText;
  if (!existing.description && input.description) patch.description = input.description;
  if (!existing.publishedAt && input.publishedAt) patch.publishedAt = input.publishedAt;
  return patch;
}

/** Transactionally upserts a normalized job offer and its source record with deduplication. */
export async function upsertOfferWithSource(
  input: NormalizedOfferInput,
): Promise<{ offerId: number; outcome: UpsertOutcome }> {
  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    const existingSource = await tx
      .select({
        id: jobOfferSources.id,
        offerId: jobOfferSources.offerId,
      })
      .from(jobOfferSources)
      .where(
        and(
          eq(jobOfferSources.source, input.source),
          eq(jobOfferSources.externalId, input.externalId),
        ),
      )
      .limit(1);

    if (existingSource.length > 0) {
      const sourceRow = existingSource[0];
      await tx
        .update(jobOfferSources)
        .set({
          url: input.url,
          rawPayload: input.rawPayload,
          fetchedAt: now,
        })
        .where(eq(jobOfferSources.id, sourceRow.id));

      const [existingOffer] = await tx
        .select({
          id: jobOffers.id,
          department: jobOffers.department,
          contractType: jobOffers.contractType,
          remoteMode: jobOffers.remoteMode,
          salaryMin: jobOffers.salaryMin,
          salaryMax: jobOffers.salaryMax,
          salaryText: jobOffers.salaryText,
          description: jobOffers.description,
          publishedAt: jobOffers.publishedAt,
        })
        .from(jobOffers)
        .where(eq(jobOffers.id, sourceRow.offerId))
        .limit(1);

      const offerPatch = existingOffer
        ? buildBackfillPatch(existingOffer, input, now)
        : { lastSeenAt: now };

      await tx
        .update(jobOffers)
        .set(offerPatch)
        .where(eq(jobOffers.id, sourceRow.offerId));

      return { offerId: sourceRow.offerId, outcome: "updated" };
    }

    const dedupKey = computeDedupKey({
      title: input.title,
      company: input.company,
      locationLabel: input.locationLabel,
    });

    const existingByDedup = await tx
      .select({ id: jobOffers.id })
      .from(jobOffers)
      .where(eq(jobOffers.dedupKey, dedupKey))
      .limit(1);

    if (existingByDedup.length > 0) {
      const offerId = existingByDedup[0].id;
      await tx.insert(jobOfferSources).values({
        offerId,
        source: input.source,
        externalId: input.externalId,
        url: input.url,
        rawPayload: input.rawPayload,
        fetchedAt: now,
      });

      await tx
        .update(jobOffers)
        .set({ lastSeenAt: now })
        .where(eq(jobOffers.id, offerId));

      return { offerId, outcome: "deduped" };
    }

    const [insertedOffer] = await tx
      .insert(jobOffers)
      .values({
        dedupKey,
        title: input.title,
        company: input.company,
        locationLabel: input.locationLabel,
        department: input.department,
        contractType: input.contractType,
        remoteMode: input.remoteMode,
        salaryMin: input.salaryMin,
        salaryMax: input.salaryMax,
        salaryText: input.salaryText,
        description: input.description,
        publishedAt: input.publishedAt,
        firstSeenAt: now,
        lastSeenAt: now,
      })
      .returning({ id: jobOffers.id });

    await tx.insert(jobOfferSources).values({
      offerId: insertedOffer.id,
      source: input.source,
      externalId: input.externalId,
      url: input.url,
      rawPayload: input.rawPayload,
      fetchedAt: now,
    });

    return { offerId: insertedOffer.id, outcome: "inserted" };
  });
}
