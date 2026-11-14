import type { Metadata } from "next";

import { SettingsPanel } from "@/components/settings/settings-panel";
import { getDefaultModelForProvider } from "@/lib/candidatures/pricing";
import {
  getDecryptedCredential,
  listCredentialStatuses,
  type CredentialProvider,
  type CredentialStatus,
  type IngestionCronConfig,
  type LlmConfigCredential,
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

const DEFAULT_LLM_CONFIG: LlmConfigCredential = {
  activeProvider: "mistral",
  model: getDefaultModelForProvider("mistral"),
};

function findStatus(
  statuses: CredentialStatus[],
  provider: CredentialProvider,
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
  const [statuses, storedCron, storedLlmConfig, runs] = await Promise.all([
    listCredentialStatuses(),
    getDecryptedCredential<IngestionCronConfig>("ingestion_cron").catch(
      () => null,
    ),
    getDecryptedCredential<LlmConfigCredential>("llm_config").catch(() => null),
    listRecentIngestionRuns(20),
  ]);

  const cronConfig: IngestionCronConfig = storedCron ?? DEFAULT_CRON_CONFIG;
  const llmConfig: LlmConfigCredential = storedLlmConfig ?? DEFAULT_LLM_CONFIG;

  return (
    <SettingsPanel
      franceTravail={findStatus(statuses, "france_travail")}
      adzuna={findStatus(statuses, "adzuna")}
      cronConfig={cronConfig}
      runs={runs}
      llmStatuses={{
        mistral: findStatus(statuses, "llm_mistral"),
        openai: findStatus(statuses, "llm_openai"),
        anthropic: findStatus(statuses, "llm_anthropic"),
      }}
      llmConfig={llmConfig}
    />
  );
}
