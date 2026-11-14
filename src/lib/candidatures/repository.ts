import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import { escapeLikePattern } from "@/server/db/like";
import { applications, jobOffers, llmUsageLogs } from "@/server/db/schema";

import type {
  ApplicationStatus,
  ApplicationTone,
  ApplicationWithOffer,
  CandidatureStats,
  LlmGenerationResult,
  LlmProvider,
} from "./types";

export interface SaveGeneratedApplicationInput {
  offerId: number;
  tone: ApplicationTone;
  customInstructions: string;
  provider: LlmProvider;
  model: string;
  result: LlmGenerationResult;
}

export interface UpdateApplicationInput {
  applicationId: number;
  status?: ApplicationStatus;
  draftSubject?: string;
  draftBody?: string;
  notes?: string;
}

export interface ListApplicationsFilters {
  status?: ApplicationStatus;
  q?: string;
}

const APPLICATION_WITH_OFFER_SELECT = {
  id: applications.id,
  offerId: applications.offerId,
  status: applications.status,
  tone: applications.tone,
  customInstructions: applications.customInstructions,
  draftSubject: applications.draftSubject,
  draftBody: applications.draftBody,
  notes: applications.notes,
  provider: applications.provider,
  model: applications.model,
  sentAt: applications.sentAt,
  createdAt: applications.createdAt,
  updatedAt: applications.updatedAt,
  offerTitle: jobOffers.title,
  offerCompany: jobOffers.company,
  offerLocationLabel: jobOffers.locationLabel,
  offerContractType: jobOffers.contractType,
  offerRemoteMode: jobOffers.remoteMode,
};

export async function saveGeneratedApplication(
  input: SaveGeneratedApplicationInput,
): Promise<{ id: number }> {
  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    const [saved] = await tx
      .insert(applications)
      .values({
        offerId: input.offerId,
        tone: input.tone,
        customInstructions: input.customInstructions,
        draftSubject: input.result.subject,
        draftBody: input.result.body,
        provider: input.provider,
        model: input.model,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: applications.offerId,
        set: {
          tone: input.tone,
          customInstructions: input.customInstructions,
          draftSubject: input.result.subject,
          draftBody: input.result.body,
          provider: input.provider,
          model: input.model,
          updatedAt: now,
        },
      })
      .returning({ id: applications.id });

    await tx.insert(llmUsageLogs).values({
      applicationId: saved.id,
      provider: input.provider,
      model: input.model,
      promptTokens: input.result.promptTokens,
      completionTokens: input.result.completionTokens,
      totalTokens: input.result.totalTokens,
      estimatedCostUsd: input.result.estimatedCostUsd.toFixed(6),
    });

    return saved;
  });
}

export async function updateApplication(
  input: UpdateApplicationInput,
) {
  const db = getDb();
  const patch: Partial<typeof applications.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.status !== undefined) {
    patch.status = input.status;
    if (input.status === "sent") {
      patch.sentAt = new Date();
    }
  }
  if (input.draftSubject !== undefined) {
    patch.draftSubject = input.draftSubject;
  }
  if (input.draftBody !== undefined) {
    patch.draftBody = input.draftBody;
  }
  if (input.notes !== undefined) {
    patch.notes = input.notes;
  }

  const rows = await db
    .update(applications)
    .set(patch)
    .where(eq(applications.id, input.applicationId))
    .returning();

  return rows[0] ?? null;
}

export async function deleteApplication(
  applicationId: number,
): Promise<{ id: number; offerId: number } | null> {
  const db = getDb();
  const rows = await db
    .delete(applications)
    .where(eq(applications.id, applicationId))
    .returning({ id: applications.id, offerId: applications.offerId });

  return rows[0] ?? null;
}

export async function getApplicationByOfferId(
  offerId: number,
): Promise<ApplicationWithOffer | null> {
  const db = getDb();
  const rows = await db
    .select(APPLICATION_WITH_OFFER_SELECT)
    .from(applications)
    .innerJoin(jobOffers, eq(applications.offerId, jobOffers.id))
    .where(eq(applications.offerId, offerId))
    .limit(1);

  return rows[0] ?? null;
}

export async function listApplications(
  filters: ListApplicationsFilters = {},
): Promise<ApplicationWithOffer[]> {
  const db = getDb();
  const conditions: SQL[] = [];

  if (filters.status) {
    conditions.push(eq(applications.status, filters.status));
  }

  const search = filters.q?.trim();
  if (search) {
    const pattern = `%${escapeLikePattern(search)}%`;
    const searchCondition = or(
      ilike(jobOffers.title, pattern),
      ilike(jobOffers.company, pattern),
      ilike(applications.draftSubject, pattern),
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const baseQuery = db
    .select(APPLICATION_WITH_OFFER_SELECT)
    .from(applications)
    .innerJoin(jobOffers, eq(applications.offerId, jobOffers.id));

  const filteredQuery =
    conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

  return filteredQuery.orderBy(desc(applications.updatedAt)).limit(200);
}

export async function getCandidatureStats(): Promise<CandidatureStats> {
  const db = getDb();

  const [statusRows, usageRows] = await Promise.all([
    db
      .select({
        status: applications.status,
        count: sql<number>`count(*)::int`,
      })
      .from(applications)
      .groupBy(applications.status),
    db
      .select({
        provider: llmUsageLogs.provider,
        calls: sql<number>`count(*)::int`,
        promptTokens: sql<number>`coalesce(sum(${llmUsageLogs.promptTokens}), 0)::int`,
        completionTokens: sql<number>`coalesce(sum(${llmUsageLogs.completionTokens}), 0)::int`,
        totalTokens: sql<number>`coalesce(sum(${llmUsageLogs.totalTokens}), 0)::int`,
        costUsd: sql<string>`coalesce(sum(${llmUsageLogs.estimatedCostUsd}::numeric), 0)::text`,
      })
      .from(llmUsageLogs)
      .groupBy(llmUsageLogs.provider),
  ]);

  const byStatus: CandidatureStats["byStatus"] = {
    draft: 0,
    validated: 0,
    sent: 0,
    archived: 0,
  };

  let totalApplications = 0;
  for (const row of statusRows) {
    const count = Number(row.count) || 0;
    byStatus[row.status] = count;
    totalApplications += count;
  }

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalCostUsd = 0;

  const usageByProvider: CandidatureStats["usageByProvider"] = usageRows.map(
    (row) => {
      const promptTokens = Number(row.promptTokens) || 0;
      const completionTokens = Number(row.completionTokens) || 0;
      const rowTotalTokens = Number(row.totalTokens) || 0;
      const costUsd = Number(row.costUsd) || 0;

      totalPromptTokens += promptTokens;
      totalCompletionTokens += completionTokens;
      totalTokens += rowTotalTokens;
      totalCostUsd += costUsd;

      return {
        provider: row.provider,
        calls: Number(row.calls) || 0,
        totalTokens: rowTotalTokens,
        costUsd: Number(costUsd.toFixed(6)),
      };
    },
  );

  return {
    totalApplications,
    byStatus,
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens,
    totalCostUsd: Number(totalCostUsd.toFixed(6)),
    usageByProvider,
  };
}
