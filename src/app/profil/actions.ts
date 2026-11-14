"use server";

import { revalidatePath } from "next/cache";

import { profileUpdateInputSchema, type ProfileUpdateInput } from "@/lib/profile/schemas";
import { parseCvBuffer, sanitizeUploadFilename, CV_MAX_BYTES } from "@/lib/profile/cv-parse";
import { parseCvStructured } from "@/lib/profile/cv-llm-parser";
import {
  getProfile as loadProfile,
  saveProfile as persistProfile,
  upsertCvAfterParse,
} from "@/lib/profile/repository";
import type { ProfileCvDto, ProfileDto } from "@/lib/profile/repository";
import { recomputeScoresForAllOffers } from "@/lib/scoring/score-repository";

export type SaveProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export type UploadCvResult =
  | { ok: true; cv: ProfileCvDto }
  | { ok: false; error: string };

export async function getProfile(): Promise<ProfileDto> {
  return loadProfile();
}

export async function saveProfile(
  input: ProfileUpdateInput,
): Promise<SaveProfileResult> {
  const parsed = profileUpdateInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Données du profil invalides." };
  }
  try {
    await persistProfile(parsed.data);
    await recomputeScoresForAllOffers();
    revalidatePath("/profil");
    revalidatePath("/offres");
    return { ok: true };
  } catch {
    return { ok: false, error: "Enregistrement du profil impossible." };
  }
}

export async function uploadCv(formData: FormData): Promise<UploadCvResult> {
  const field = formData.get("file");
  if (!(field instanceof File)) {
    return { ok: false, error: "Format non supporté (PDF ou DOCX uniquement)." };
  }

  if (field.size > CV_MAX_BYTES) {
    return {
      ok: false,
      error: "Fichier trop volumineux (max 5 Mo).",
    };
  }

  const buffer = Buffer.from(await field.arrayBuffer());
  const parsed = await parseCvBuffer(buffer, field.type || undefined);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  try {
    const [profile, structuredResult] = await Promise.all([
      loadProfile(),
      parseCvStructured(parsed.text),
    ]);
    const cv = await upsertCvAfterParse(
      sanitizeUploadFilename(field.name),
      parsed.mimeType,
      parsed.text,
      profile.skills.map((s) => s.label),
      profile.email,
      profile.phone,
      {
        structured: structuredResult.structured,
        parseMode: structuredResult.mode,
        layout: parsed.layout,
      },
    );
    await recomputeScoresForAllOffers();
    revalidatePath("/profil");
    revalidatePath("/offres");
    return { ok: true, cv };
  } catch (err) {
    console.error("[uploadCv] failed to persist CV:", err);
    return { ok: false, error: "Impossible d'enregistrer le CV." };
  }
}

export async function reanalyzeCvWithAi(): Promise<UploadCvResult> {
  try {
    const profile = await loadProfile();
    const cvRow = profile.cv;
    if (!cvRow || !cvRow.extractedText.trim()) {
      return { ok: false, error: "Aucun CV enregistré à analyser." };
    }

    const structuredResult = await parseCvStructured(cvRow.extractedText);
    const cv = await upsertCvAfterParse(
      cvRow.originalFilename,
      cvRow.mimeType,
      cvRow.extractedText,
      profile.skills.map((s) => s.label),
      profile.email,
      profile.phone,
      {
        structured: structuredResult.structured,
        parseMode: structuredResult.mode,
        layout: {
          isMultiColumn: cvRow.isMultiColumn,
          pageCount: cvRow.pageCount,
        },
      },
    );
    await recomputeScoresForAllOffers();
    revalidatePath("/profil");
    revalidatePath("/offres");
    return { ok: true, cv };
  } catch (err) {
    console.error("[reanalyzeCvWithAi] failed:", err);
    return { ok: false, error: "Impossible de ré-analyser le CV." };
  }
}

function toIsoDateOrNull(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || /present|actuel|aujourd/i.test(trimmed)) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const yearMatch = trimmed.match(/\b(19\d{2}|20\d{2})\b/);
  return yearMatch ? `${yearMatch[1]}-01-01` : null;
}

export async function applyStructuredCvToProfile(): Promise<SaveProfileResult> {
  try {
    const profile = await loadProfile();
    const structured = profile.cv?.structuredSections;
    if (!structured) {
      return { ok: false, error: "Aucune donnée structurée de CV disponible." };
    }

    const seenSkillKeys = new Set<string>();
    const cvSkills: string[] = [];
    for (const skill of structured.skills) {
      const trimmed = skill.trim().slice(0, 120);
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seenSkillKeys.has(key)) continue;
      seenSkillKeys.add(key);
      if (cvSkills.length < 80) cvSkills.push(trimmed);
    }
    const nextSkills =
      cvSkills.length > 0 ? cvSkills : profile.skills.map((s) => s.label);

    const seenExpKeys = new Set<string>();
    const cvExperiences: ProfileUpdateInput["experiences"] = [];
    const fallbackStartDate = `${new Date().getFullYear()}-01-01`;
    for (const exp of structured.experiences) {
      const title = exp.title.trim().slice(0, 200);
      if (!title) continue;
      const company = exp.company.trim().slice(0, 200);
      const key = `${title.toLowerCase()}::${company.toLowerCase()}`;
      if (seenExpKeys.has(key) || cvExperiences.length >= 40) continue;
      seenExpKeys.add(key);
      cvExperiences.push({
        title,
        company,
        location: "",
        startDate: toIsoDateOrNull(exp.startDate) ?? fallbackStartDate,
        endDate: toIsoDateOrNull(exp.endDate),
        description: exp.highlights.join("\n").slice(0, 8000),
        sortOrder: cvExperiences.length,
      });
    }
    const nextExperiences =
      cvExperiences.length > 0
        ? cvExperiences
        : profile.experiences.map((e, idx) => ({
            title: e.title,
            company: e.company,
            location: e.location,
            startDate: e.startDate,
            endDate: e.endDate,
            description: e.description,
            sortOrder: idx,
          }));

    const candidateInput: ProfileUpdateInput = {
      fullName: (
        structured.contact.fullName?.trim() ||
        profile.fullName.trim() ||
        ""
      ).slice(0, 200),
      headline: (
        structured.contact.headline?.trim() ||
        profile.headline.trim() ||
        ""
      ).slice(0, 300),
      email: structured.contact.emails[0]?.trim() || profile.email.trim() || "",
      phone: (
        structured.contact.phones[0]?.trim() ||
        profile.phone.trim() ||
        ""
      ).slice(0, 40),
      locationLabel: (
        structured.contact.location?.trim() ||
        profile.locationLabel.trim() ||
        "Non renseigné"
      ).slice(0, 200),
      searchRadiusKm: profile.searchRadiusKm,
      remotePreference: profile.remotePreference,
      minSalaryAnnualGross: profile.minSalaryAnnualGross,
      contractTypes: profile.contractTypes,
      skills: nextSkills,
      experiences: nextExperiences,
    };

    const validated = profileUpdateInputSchema.safeParse(candidateInput);
    if (!validated.success) {
      return { ok: false, error: "Données extraites incompatibles avec le profil." };
    }

    await persistProfile(validated.data);
    await recomputeScoresForAllOffers();
    revalidatePath("/profil");
    revalidatePath("/offres");
    return { ok: true };
  } catch (err) {
    console.error("[applyStructuredCvToProfile] failed:", err);
    return { ok: false, error: "Impossible d'appliquer les données du CV." };
  }
}
