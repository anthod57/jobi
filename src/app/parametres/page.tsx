import type { Metadata } from "next";

import { SettingsPanel } from "@/components/settings/settings-panel";
import {
  getDecryptedCredential,
  listCredentialStatuses,
  type CredentialStatus,
  type IngestionCronConfig,
} from "@/lib/ingestion/credentials-repository";
import { listRecentIngestionRuns } from "@/lib/ingestion/sync";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paramètres — Jobi",
};

const DEFAULT_CRON_CONFIG: IngestionCronConfig = {
  enabled: false,
  intervalHours: 24,
};

function findStatus(
  statuses: CredentialStatus[],
  provider: "france_travail" | "adzuna",
): CredentialStatus {
  return (
    statuses.find((s) => s.provider === provider) ?? {
      provider,
      configured: false,
      keyHint: "",
      updatedAt: null,
    }
  );
}

export default async function ParametresPage() {
  const [statuses, storedCron, runs] = await Promise.all([
    listCredentialStatuses(),
    getDecryptedCredential<IngestionCronConfig>("ingestion_cron").catch(
      () => null,
    ),
    listRecentIngestionRuns(20),
  ]);

  const cronConfig: IngestionCronConfig = storedCron ?? DEFAULT_CRON_CONFIG;

  return (
    <SettingsPanel
      franceTravail={findStatus(statuses, "france_travail")}
      adzuna={findStatus(statuses, "adzuna")}
      cronConfig={cronConfig}
      runs={runs}
    />
  );
}
