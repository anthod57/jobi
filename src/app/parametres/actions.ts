"use server";

import { revalidatePath } from "next/cache";

import { saveEncryptedCredential } from "@/lib/ingestion/credentials-repository";
import { runIngestionSync } from "@/lib/ingestion/sync";

export type SettingsActionState = {
  ok: boolean;
  message: string;
};

const VALID_INTERVALS = new Set([6, 12, 24]);

function readField(formData: FormData, key: string): string {
  const val = formData.get(key);
  return typeof val === "string" ? val.trim() : "";
}

/** Validates, encrypts, and stores France Travail or Adzuna API credentials. */
export async function saveProviderCredentialsAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const provider = readField(formData, "provider");

  try {
    if (provider === "france_travail") {
      const clientId = readField(formData, "clientId");
      const clientSecret = readField(formData, "clientSecret");
      if (!clientId || !clientSecret) {
        return {
          ok: false,
          message: "Identifiant client et clé secrète France Travail requis.",
        };
      }
      await saveEncryptedCredential(
        "france_travail",
        { clientId, clientSecret },
        clientId,
      );
      revalidatePath("/parametres");
      revalidatePath("/offres");
      return { ok: true, message: "Clés France Travail enregistrées." };
    }

    if (provider === "adzuna") {
      const appId = readField(formData, "appId");
      const appKey = readField(formData, "appKey");
      if (!appId || !appKey) {
        return {
          ok: false,
          message: "App ID et App Key Adzuna requis.",
        };
      }
      await saveEncryptedCredential("adzuna", { appId, appKey }, appId);
      revalidatePath("/parametres");
      revalidatePath("/offres");
      return { ok: true, message: "Clés Adzuna enregistrées." };
    }

    return { ok: false, message: "Fournisseur inconnu." };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer les identifiants.",
    };
  }
}

/** Saves automatic ingestion cron configuration (`enabled` + `intervalHours`). */
export async function saveCronConfigAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const enabled = formData.get("enabled") === "on";
  const intervalHours = Number(readField(formData, "intervalHours"));

  if (!VALID_INTERVALS.has(intervalHours)) {
    return {
      ok: false,
      message: "Fréquence invalide (choisir 6, 12 ou 24 heures).",
    };
  }

  try {
    await saveEncryptedCredential(
      "ingestion_cron",
      { enabled, intervalHours },
      `cron:${intervalHours}h`,
    );
    revalidatePath("/parametres");
    return {
      ok: true,
      message: enabled
        ? `Synchronisation automatique activée (toutes les ${intervalHours} h).`
        : "Synchronisation automatique désactivée.",
    };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer la configuration cron.",
    };
  }
}

/** Triggers a manual ingestion sync across all configured sources. */
export async function triggerManualIngestionAction(): Promise<SettingsActionState> {
  try {
    const { runs, skippedReason } = await runIngestionSync({
      trigger: "manual",
    });

    if (skippedReason === "already_running") {
      return {
        ok: false,
        message: "Une synchronisation est déjà en cours.",
      };
    }

    if (runs.length === 0) {
      return {
        ok: false,
        message:
          "Aucune source configurée. Renseignez France Travail ou Adzuna d'abord.",
      };
    }

    revalidatePath("/parametres");
    revalidatePath("/offres");

    const inserted = runs.reduce((sum, r) => sum + r.insertedCount, 0);
    const updated = runs.reduce((sum, r) => sum + r.updatedCount, 0);
    const deduped = runs.reduce((sum, r) => sum + r.dedupedCount, 0);
    const hasError = runs.some((r) => r.status === "error");

    return {
      ok: !hasError,
      message: hasError
        ? "Import terminé avec des erreurs. Consultez l'historique ci-dessous."
        : `Import terminé : ${inserted} ajoutée(s), ${updated} mise(s) à jour, ${deduped} dédupliquée(s).`,
    };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Erreur lors de l'import manuel.",
    };
  }
}
