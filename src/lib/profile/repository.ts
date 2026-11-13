import { asc, eq } from "drizzle-orm";

import type { ProfileUpdateInput } from "@/lib/profile/schemas";
import { runAtsAnalysis } from "@/lib/profile/ats/runAtsAnalysis";
import type { AtsFinding } from "@/lib/profile/ats/types";
import { getDb } from "@/server/db/client";
import {
  profileCv,
  profileExperiences,
  profileSkills,
  profiles,
} from "@/server/db/schema";

export const PROFILE_ID = 1;

export type ProfileExperienceDto = {
  id: number;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | null;
  description: string;
  sortOrder: number;
};

export type ProfileCvDto = {
  originalFilename: string;
  mimeType: string;
  extractedText: string;
  uploadedAt: Date | null;
  atsScore: number | null;
  atsFindings: AtsFinding[];
  atsAnalyzedAt: Date | null;
};

export type ProfileDto = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  locationLabel: string;
  searchRadiusKm: number;
  remotePreference: ProfileUpdateInput["remotePreference"];
  minSalaryAnnualGross: number | null;
  contractTypes: ProfileUpdateInput["contractTypes"];
  skills: { id: number; label: string; sortOrder: number }[];
  experiences: ProfileExperienceDto[];
  cv: ProfileCvDto | null;
};

function mapCvRow(
  row: typeof profileCv.$inferSelect | undefined,
): ProfileCvDto | null {
  if (!row) return null;
  return {
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    extractedText: row.extractedText,
    uploadedAt: row.uploadedAt,
    atsScore: row.atsScore,
    atsFindings: (row.atsFindings as AtsFinding[]) ?? [],
    atsAnalyzedAt: row.atsAnalyzedAt,
  };
}

export async function getProfile(): Promise<ProfileDto> {
  const db = getDb();

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, PROFILE_ID))
    .limit(1);
  if (!profile) {
    throw new Error("Profil introuvable.");
  }

  const skills = await db
    .select()
    .from(profileSkills)
    .where(eq(profileSkills.profileId, PROFILE_ID))
    .orderBy(asc(profileSkills.sortOrder), asc(profileSkills.id));

  const experiences = await db
    .select()
    .from(profileExperiences)
    .where(eq(profileExperiences.profileId, PROFILE_ID))
    .orderBy(asc(profileExperiences.sortOrder), asc(profileExperiences.id));

  const [cvRow] = await db
    .select()
    .from(profileCv)
    .where(eq(profileCv.profileId, PROFILE_ID))
    .limit(1);

  return {
    fullName: profile.fullName,
    headline: profile.headline ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    locationLabel: profile.locationLabel,
    searchRadiusKm: profile.searchRadiusKm,
    remotePreference: profile.remotePreference,
    minSalaryAnnualGross: profile.minSalaryAnnualGross,
    contractTypes: profile.contractTypes,
    skills: skills.map((s) => ({
      id: s.id,
      label: s.label,
      sortOrder: s.sortOrder,
    })),
    experiences: experiences.map((e) => ({
      id: e.id,
      title: e.title,
      company: e.company,
      location: e.location ?? "",
      startDate: e.startDate,
      endDate: e.endDate,
      description: e.description,
      sortOrder: e.sortOrder,
    })),
    cv: mapCvRow(cvRow),
  };
}

type DbClient = ReturnType<typeof getDb>;

async function runAndPersistAts(
  tx: DbClient,
  extractedText: string,
  profileEmail: string,
  profilePhone: string,
  skillLabels: string[],
): Promise<AtsFinding[]> {
  const ats = runAtsAnalysis(extractedText, {
    profileSkills: skillLabels,
    profileEmail,
    profilePhone,
  });
  const now = new Date();
  await tx
    .update(profileCv)
    .set({
      atsScore: ats.score,
      atsFindings: ats.findings,
      atsAnalyzedAt: now,
    })
    .where(eq(profileCv.profileId, PROFILE_ID));
  return ats.findings;
}

export async function saveProfile(input: ProfileUpdateInput): Promise<void> {
  const db = getDb();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({
        fullName: input.fullName,
        headline: input.headline,
        email: input.email,
        phone: input.phone,
        locationLabel: input.locationLabel,
        searchRadiusKm: input.searchRadiusKm,
        remotePreference: input.remotePreference,
        minSalaryAnnualGross: input.minSalaryAnnualGross,
        contractTypes: input.contractTypes,
        updatedAt: now,
      })
      .where(eq(profiles.id, PROFILE_ID));

    await tx
      .delete(profileSkills)
      .where(eq(profileSkills.profileId, PROFILE_ID));
    if (input.skills.length > 0) {
      await tx.insert(profileSkills).values(
        input.skills.map((label, index) => ({
          profileId: PROFILE_ID,
          label,
          sortOrder: index,
        })),
      );
    }

    await tx
      .delete(profileExperiences)
      .where(eq(profileExperiences.profileId, PROFILE_ID));
    if (input.experiences.length > 0) {
      await tx.insert(profileExperiences).values(
        input.experiences.map((exp, index) => ({
          profileId: PROFILE_ID,
          title: exp.title,
          company: exp.company,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate,
          description: exp.description,
          sortOrder: exp.sortOrder ?? index,
        })),
      );
    }

    const [cvRow] = await tx
      .select()
      .from(profileCv)
      .where(eq(profileCv.profileId, PROFILE_ID))
      .limit(1);
    const extractedText = cvRow?.extractedText?.trim() ?? "";
    if (extractedText) {
      await runAndPersistAts(
        tx,
        extractedText,
        input.email,
        input.phone,
        input.skills,
      );
    }
  });
}

export async function upsertCvAfterParse(
  originalFilename: string,
  mimeType: string,
  extractedText: string,
  skillLabels: string[],
  profileEmail: string,
  profilePhone: string,
): Promise<void> {
  const db = getDb();
  const now = new Date();
  const ats = runAtsAnalysis(extractedText, {
    profileSkills: skillLabels,
    profileEmail,
    profilePhone,
  });

  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(profileCv)
      .where(eq(profileCv.profileId, PROFILE_ID))
      .limit(1);
    if (existing) {
      await tx
        .update(profileCv)
        .set({
          originalFilename,
          mimeType,
          extractedText,
          uploadedAt: now,
          atsScore: ats.score,
          atsFindings: ats.findings,
          atsAnalyzedAt: now,
        })
        .where(eq(profileCv.profileId, PROFILE_ID));
    } else {
      await tx.insert(profileCv).values({
        profileId: PROFILE_ID,
        originalFilename,
        mimeType,
        extractedText,
        uploadedAt: now,
        atsScore: ats.score,
        atsFindings: ats.findings,
        atsAnalyzedAt: now,
      });
    }
  });
}
