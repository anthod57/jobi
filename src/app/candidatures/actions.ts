"use server";

import { revalidatePath } from "next/cache";

import { generateWithLlm } from "@/lib/candidatures/llm-client";
import { getDefaultModelForProvider } from "@/lib/candidatures/pricing";
import { buildApplicationPrompt } from "@/lib/candidatures/prompt";
import {
  saveGeneratedApplication,
  updateApplication,
} from "@/lib/candidatures/repository";
import {
  generateDraftSchema,
  updateApplicationSchema,
} from "@/lib/candidatures/schemas";
import {
  getDecryptedCredential,
  type LlmApiKeyCredential,
  type LlmConfigCredential,
} from "@/lib/ingestion/credentials-repository";
import { getProfile } from "@/lib/profile/repository";
import { getScoredOfferById } from "@/lib/scoring/score-repository";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Generates an application draft via the configured LLM provider and persists it. */
export async function generateDraftAction(input: {
  offerId: number;
  tone: "professional" | "direct" | "enthusiastic";
  customInstructions: string;
}): Promise<ActionResult<{ applicationId: number }>> {
  const parsed = generateDraftSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Paramètres de génération invalides." };
  }

  const { offerId, tone, customInstructions } = parsed.data;

  try {
    const config = await getDecryptedCredential<LlmConfigCredential>("llm_config");
    const activeProvider = config?.activeProvider ?? "mistral";
    const model =
      config?.model?.trim() || getDefaultModelForProvider(activeProvider);

    const keyCred = await getDecryptedCredential<LlmApiKeyCredential>(
      `llm_${activeProvider}`,
    );
    if (!keyCred?.apiKey?.trim()) {
      return {
        ok: false,
        error:
          "Aucune clé API LLM configurée pour le fournisseur actif. Rendez-vous dans Paramètres.",
      };
    }

    const [offer, profile] = await Promise.all([
      getScoredOfferById(offerId),
      getProfile(),
    ]);

    if (!offer) {
      return { ok: false, error: "Offre introuvable." };
    }

    const prompt = buildApplicationPrompt(
      {
        title: offer.title,
        company: offer.company,
        locationLabel: offer.locationLabel,
        contractType: offer.contractType,
        remoteMode: offer.remoteMode,
        description: offer.description,
      },
      {
        headline: profile.headline,
        skills: profile.skills.map((s) => s.label),
        experiences: profile.experiences.map((exp) => ({
          title: exp.title,
          company: exp.company,
          description: exp.description,
        })),
        cvText: profile.cv?.extractedText ?? "",
      },
      tone,
      customInstructions,
    );

    const result = await generateWithLlm(
      activeProvider,
      keyCred.apiKey,
      model,
      prompt,
    );

    const saved = await saveGeneratedApplication({
      offerId,
      tone,
      customInstructions,
      provider: activeProvider,
      model,
      result,
    });

    revalidatePath(`/offres/${offerId}`);
    revalidatePath("/candidatures");

    return { ok: true, data: { applicationId: saved.id } };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Impossible de générer le brouillon.",
    };
  }
}

/** Updates an application's status, draft subject/body, or notes. */
export async function updateApplicationAction(input: {
  applicationId: number;
  status?: "draft" | "validated" | "sent" | "archived";
  draftSubject?: string;
  draftBody?: string;
  notes?: string;
}): Promise<ActionResult> {
  const parsed = updateApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Données de candidature invalides." };
  }

  try {
    const updated = await updateApplication(parsed.data);
    if (!updated) {
      return { ok: false, error: "Candidature introuvable." };
    }

    revalidatePath("/candidatures");
    revalidatePath(`/offres/${updated.offerId}`);

    return { ok: true, data: undefined };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Impossible de mettre à jour la candidature.",
    };
  }
}
