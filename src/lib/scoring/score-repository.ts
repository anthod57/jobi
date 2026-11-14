import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { getDb } from "@/server/db/client";
import {
  jobOffers,
  jobOfferSources,
  offerScores,
  profiles,
  profileSkills,
} from "@/server/db/schema";

import { offerFiltersSchema, type OfferFilters } from "./schemas";
import { scoreOffer, type ScorableProfile } from "./score-offer";
import type {
  ListScoredOffersResult,
  ScoreBreakdown,
  ScoredOfferDetail,
  ScoredOfferItem,
  ScoredOfferSource,
} from "./types";

async function loadActiveProfile(): Promise<{
  id: number;
  profile: ScorableProfile;
} | null> {
  const db = getDb();
  const [profileRow] = await db.select().from(profiles).limit(1);
  if (!profileRow) return null;

  const skillRows = await db
    .select({ label: profileSkills.label })
    .from(profileSkills)
    .where(eq(profileSkills.profileId, profileRow.id));

  return {
    id: profileRow.id,
    profile: {
      headline: profileRow.headline,
      locationLabel: profileRow.locationLabel,
      remotePreference: profileRow.remotePreference,
      minSalaryAnnualGross: profileRow.minSalaryAnnualGross,
      contractTypes: profileRow.contractTypes,
      skills: skillRows.map((s) => s.label),
    },
  };
}

async function scoreAndUpsertOffers(
  profileId: number,
  profile: ScorableProfile,
  offers: {
    id: number;
    title: string;
    company: string;
    locationLabel: string;
    contractType: ScorableProfile["contractTypes"][number] | null;
    remoteMode: ScorableProfile["remotePreference"] | null;
    salaryMin: number | null;
    salaryMax: number | null;
    description: string;
  }[],
): Promise<number> {
  if (offers.length === 0) return 0;

  const db = getDb();
  const now = new Date();
  const values = offers.map((offer) => {
    const result = scoreOffer(offer, profile);
    return {
      offerId: offer.id,
      profileId,
      score: result.score,
      breakdown: result.breakdown,
      computedAt: now,
    };
  });

  await db
    .insert(offerScores)
    .values(values)
    .onConflictDoUpdate({
      target: offerScores.offerId,
      set: {
        profileId: sql`excluded.profile_id`,
        score: sql`excluded.score`,
        breakdown: sql`excluded.breakdown`,
        computedAt: sql`excluded.computed_at`,
      },
    });

  return values.length;
}

export async function recomputeScoresForAllOffers(): Promise<number> {
  const active = await loadActiveProfile();
  if (!active) return 0;

  const db = getDb();
  const offers = await db
    .select({
      id: jobOffers.id,
      title: jobOffers.title,
      company: jobOffers.company,
      locationLabel: jobOffers.locationLabel,
      contractType: jobOffers.contractType,
      remoteMode: jobOffers.remoteMode,
      salaryMin: jobOffers.salaryMin,
      salaryMax: jobOffers.salaryMax,
      description: jobOffers.description,
    })
    .from(jobOffers)
    .where(eq(jobOffers.isActive, true));

  return scoreAndUpsertOffers(active.id, active.profile, offers);
}

export async function recomputeScoresForOfferIds(
  offerIds: number[],
): Promise<number> {
  if (offerIds.length === 0) return 0;

  const active = await loadActiveProfile();
  if (!active) return 0;

  const db = getDb();
  const offers = await db
    .select({
      id: jobOffers.id,
      title: jobOffers.title,
      company: jobOffers.company,
      locationLabel: jobOffers.locationLabel,
      contractType: jobOffers.contractType,
      remoteMode: jobOffers.remoteMode,
      salaryMin: jobOffers.salaryMin,
      salaryMax: jobOffers.salaryMax,
      description: jobOffers.description,
    })
    .from(jobOffers)
    .where(inArray(jobOffers.id, offerIds));

  return scoreAndUpsertOffers(active.id, active.profile, offers);
}

function buildOfferFilterConditions(filters: OfferFilters): SQL | undefined {
  const conditions: SQL[] = [eq(jobOffers.isActive, true)];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    const qCond = or(
      ilike(jobOffers.title, pattern),
      ilike(jobOffers.company, pattern),
      ilike(jobOffers.description, pattern),
    );
    if (qCond) conditions.push(qCond);
  }

  if (filters.contractType) {
    conditions.push(eq(jobOffers.contractType, filters.contractType));
  }

  if (filters.remoteMode) {
    conditions.push(eq(jobOffers.remoteMode, filters.remoteMode));
  }

  if (filters.minScore !== undefined) {
    conditions.push(gte(offerScores.score, filters.minScore));
  }

  if (filters.source) {
    conditions.push(
      sql`exists (select 1 from ${jobOfferSources} where ${jobOfferSources.offerId} = ${jobOffers.id} and ${jobOfferSources.source} = ${filters.source})`,
    );
  }

  return and(...conditions);
}

async function loadSourcesByOfferIds(
  offerIds: number[],
): Promise<Map<number, ScoredOfferSource[]>> {
  const map = new Map<number, ScoredOfferSource[]>();
  if (offerIds.length === 0) return map;

  const db = getDb();
  const rows = await db
    .select({
      offerId: jobOfferSources.offerId,
      source: jobOfferSources.source,
      url: jobOfferSources.url,
    })
    .from(jobOfferSources)
    .where(inArray(jobOfferSources.offerId, offerIds));

  for (const row of rows) {
    const list = map.get(row.offerId) ?? [];
    list.push({ source: row.source, url: row.url });
    map.set(row.offerId, list);
  }

  return map;
}

export async function listScoredOffers(
  rawFilters: Partial<OfferFilters> = {},
): Promise<ListScoredOffersResult> {
  const filters = offerFiltersSchema.parse(rawFilters);
  const db = getDb();
  const whereClause = buildOfferFilterConditions(filters);

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(jobOffers)
    .leftJoin(offerScores, eq(offerScores.offerId, jobOffers.id))
    .where(whereClause);

  const total = countRow?.total ?? 0;

  const orderBy =
    filters.sort === "date"
      ? [sql`${jobOffers.publishedAt} DESC NULLS LAST`, desc(jobOffers.id)]
      : [
          sql`${offerScores.score} DESC NULLS LAST`,
          sql`${jobOffers.publishedAt} DESC NULLS LAST`,
          desc(jobOffers.id),
        ];

  const rows = await db
    .select({
      id: jobOffers.id,
      title: jobOffers.title,
      company: jobOffers.company,
      locationLabel: jobOffers.locationLabel,
      department: jobOffers.department,
      contractType: jobOffers.contractType,
      remoteMode: jobOffers.remoteMode,
      salaryMin: jobOffers.salaryMin,
      salaryMax: jobOffers.salaryMax,
      salaryText: jobOffers.salaryText,
      publishedAt: jobOffers.publishedAt,
      lastSeenAt: jobOffers.lastSeenAt,
      score: offerScores.score,
      breakdown: offerScores.breakdown,
    })
    .from(jobOffers)
    .leftJoin(offerScores, eq(offerScores.offerId, jobOffers.id))
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(filters.pageSize)
    .offset((filters.page - 1) * filters.pageSize);

  const sourcesMap = await loadSourcesByOfferIds(rows.map((r) => r.id));

  const items: ScoredOfferItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    company: row.company,
    locationLabel: row.locationLabel,
    department: row.department,
    contractType: row.contractType,
    remoteMode: row.remoteMode,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    salaryText: row.salaryText,
    publishedAt: row.publishedAt,
    lastSeenAt: row.lastSeenAt,
    score: row.score ?? null,
    breakdown: (row.breakdown as ScoreBreakdown | null) ?? null,
    sources: sourcesMap.get(row.id) ?? [],
  }));

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export async function getScoredOfferById(
  id: number,
): Promise<ScoredOfferDetail | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: jobOffers.id,
      title: jobOffers.title,
      company: jobOffers.company,
      locationLabel: jobOffers.locationLabel,
      department: jobOffers.department,
      contractType: jobOffers.contractType,
      remoteMode: jobOffers.remoteMode,
      salaryMin: jobOffers.salaryMin,
      salaryMax: jobOffers.salaryMax,
      salaryText: jobOffers.salaryText,
      description: jobOffers.description,
      publishedAt: jobOffers.publishedAt,
      lastSeenAt: jobOffers.lastSeenAt,
      score: offerScores.score,
      breakdown: offerScores.breakdown,
      computedAt: offerScores.computedAt,
    })
    .from(jobOffers)
    .leftJoin(offerScores, eq(offerScores.offerId, jobOffers.id))
    .where(eq(jobOffers.id, id))
    .limit(1);

  if (!row) return null;

  const sourcesMap = await loadSourcesByOfferIds([row.id]);

  return {
    id: row.id,
    title: row.title,
    company: row.company,
    locationLabel: row.locationLabel,
    department: row.department,
    contractType: row.contractType,
    remoteMode: row.remoteMode,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    salaryText: row.salaryText,
    description: row.description,
    publishedAt: row.publishedAt,
    lastSeenAt: row.lastSeenAt,
    score: row.score ?? null,
    breakdown: (row.breakdown as ScoreBreakdown | null) ?? null,
    computedAt: row.computedAt ?? null,
    sources: sourcesMap.get(row.id) ?? [],
  };
}
