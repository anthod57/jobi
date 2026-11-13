import { asc, eq } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import { profileSkills, profiles } from "@/server/db/schema";

export type IngestionSearchQuery = {
  keywords: string;
  maxDaysOld?: number;
};

const TOP_SKILLS_LIMIT = 5;

/** Builds broad search keywords from the local profile without geo or contract filters. */
export async function buildSearchQueryFromProfile(options?: {
  maxDaysOld?: number;
}): Promise<IngestionSearchQuery> {
  const db = getDb();
  const [profile] = await db
    .select({ id: profiles.id, headline: profiles.headline })
    .from(profiles)
    .orderBy(asc(profiles.id))
    .limit(1);

  if (!profile) {
    return { keywords: "", maxDaysOld: options?.maxDaysOld };
  }

  const headline = (profile.headline ?? "").trim();
  if (headline) {
    return { keywords: headline, maxDaysOld: options?.maxDaysOld };
  }

  const skills = await db
    .select({ label: profileSkills.label })
    .from(profileSkills)
    .where(eq(profileSkills.profileId, profile.id))
    .orderBy(asc(profileSkills.sortOrder))
    .limit(TOP_SKILLS_LIMIT);

  const keywords = skills
    .map((skill) => skill.label.trim())
    .filter(Boolean)
    .join(" ");

  return { keywords, maxDaysOld: options?.maxDaysOld };
}
