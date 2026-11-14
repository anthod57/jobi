"use server";

import { revalidatePath } from "next/cache";

import { profileUpdateInputSchema, type ProfileUpdateInput } from "@/lib/profile/schemas";
import { parseCvBuffer, sanitizeUploadFilename, CV_MAX_BYTES } from "@/lib/profile/cv-parse";
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
    const profile = await loadProfile();
    const cv = await upsertCvAfterParse(
      sanitizeUploadFilename(field.name),
      parsed.mimeType,
      parsed.text,
      profile.skills.map((s) => s.label),
      profile.email,
      profile.phone,
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
