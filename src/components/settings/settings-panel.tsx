"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

import {
  saveCronConfigAction,
  saveProviderCredentialsAction,
  triggerManualIngestionAction,
  type SettingsActionState,
} from "@/app/parametres/actions";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Label,
  Select,
} from "@/components/ui";
import type {
  CredentialStatus,
  IngestionCronConfig,
} from "@/lib/ingestion/credentials-repository";
import type { IngestionRunSummary } from "@/lib/ingestion/sync";

export type SettingsPanelProps = {
  franceTravail: CredentialStatus;
  adzuna: CredentialStatus;
  cronConfig: IngestionCronConfig;
  runs: IngestionRunSummary[];
};

const INITIAL_STATE: SettingsActionState = { ok: false, message: "" };

const SOURCE_LABELS: Record<IngestionRunSummary["source"], string> = {
  france_travail: "France Travail",
  adzuna: "Adzuna",
};

const STATUS_BADGE: Record<
  IngestionRunSummary["status"],
  { label: string; color: "success" | "warning" | "failure" | "info" }
> = {
  success: { label: "Succès", color: "success" },
  partial: { label: "Partiel", color: "warning" },
  error: { label: "Erreur", color: "failure" },
  running: { label: "En cours", color: "info" },
};

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function ActionFeedback({ state }: { state: SettingsActionState | null }) {
  if (!state?.message) return null;
  return (
    <div aria-live="polite">
      <Alert variant={state.ok ? "success" : "failure"}>{state.message}</Alert>
    </div>
  );
}

function ProviderStatusBadge({ status }: { status: CredentialStatus }) {
  return (
    <div className="flex items-center gap-2">
      <Badge color={status.configured ? "success" : "gray"}>
        {status.configured ? "Configuré" : "Non configuré"}
      </Badge>
      {status.configured && status.keyHint ? (
        <span className="text-xs text-secondary-600 dark:text-secondary-400">
          Identifiant : {status.keyHint}
        </span>
      ) : null}
    </div>
  );
}

export function SettingsPanel({
  franceTravail,
  adzuna,
  cronConfig,
  runs,
}: SettingsPanelProps) {
  const router = useRouter();
  const [ftState, ftAction, ftPending] = useActionState(
    saveProviderCredentialsAction,
    INITIAL_STATE,
  );
  const [adzunaState, adzunaAction, adzunaPending] = useActionState(
    saveProviderCredentialsAction,
    INITIAL_STATE,
  );
  const [cronState, cronAction, cronPending] = useActionState(
    saveCronConfigAction,
    INITIAL_STATE,
  );
  const [syncState, setSyncState] = useState<SettingsActionState | null>(null);
  const [isSyncing, startSync] = useTransition();

  const hasAnySource = franceTravail.configured || adzuna.configured;

  function handleManualSync() {
    startSync(async () => {
      const result = await triggerManualIngestionAction();
      setSyncState(result);
      router.refresh();
    });
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col gap-1 border-b border-secondary-200 pb-4 dark:border-secondary-800">
        <h1 className="text-2xl font-semibold tracking-tight text-secondary-950 dark:text-white">
          Paramètres
        </h1>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Configurez vos clés API (chiffrées en base), la synchronisation
          automatique et lancez un import manuel.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-secondary-950 dark:text-white">
                France Travail
              </h2>
              <ProviderStatusBadge status={franceTravail} />
            </div>

            <form action={ftAction} className="space-y-3">
              <input type="hidden" name="provider" value="france_travail" />
              <div>
                <Label htmlFor="ft-client-id" className="mb-1 block">
                  Client ID
                </Label>
                <Input
                  id="ft-client-id"
                  name="clientId"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="PAR_..."
                />
              </div>
              <div>
                <Label htmlFor="ft-client-secret" className="mb-1 block">
                  Client Secret
                </Label>
                <Input
                  id="ft-client-secret"
                  name="clientSecret"
                  type="password"
                  required
                  autoComplete="off"
                  placeholder="••••••••"
                />
              </div>
              <ActionFeedback state={ftState} />
              <Button type="submit" color="primary" disabled={ftPending}>
                {ftPending ? "Enregistrement..." : "Enregistrer France Travail"}
              </Button>
            </form>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-secondary-950 dark:text-white">
                Adzuna
              </h2>
              <ProviderStatusBadge status={adzuna} />
            </div>

            <form action={adzunaAction} className="space-y-3">
              <input type="hidden" name="provider" value="adzuna" />
              <div>
                <Label htmlFor="adzuna-app-id" className="mb-1 block">
                  App ID
                </Label>
                <Input
                  id="adzuna-app-id"
                  name="appId"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Votre App ID"
                />
              </div>
              <div>
                <Label htmlFor="adzuna-app-key" className="mb-1 block">
                  App Key
                </Label>
                <Input
                  id="adzuna-app-key"
                  name="appKey"
                  type="password"
                  required
                  autoComplete="off"
                  placeholder="••••••••"
                />
              </div>
              <ActionFeedback state={adzunaState} />
              <Button type="submit" color="primary" disabled={adzunaPending}>
                {adzunaPending ? "Enregistrement..." : "Enregistrer Adzuna"}
              </Button>
            </form>
          </div>
        </Card>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-secondary-950 dark:text-white">
              Synchronisation automatique (cron)
            </h2>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Définissez si l&apos;import automatique est actif et sa fréquence.
            </p>
          </div>

          <form action={cronAction} className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="cron-enabled"
                name="enabled"
                defaultChecked={cronConfig.enabled}
              />
              <Label htmlFor="cron-enabled">
                Activer la synchronisation automatique
              </Label>
            </div>

            <div className="max-w-xs">
              <Label htmlFor="cron-interval" className="mb-1 block">
                Intervalle
              </Label>
              <Select
                id="cron-interval"
                name="intervalHours"
                defaultValue={String(cronConfig.intervalHours)}
              >
                <option value="6">Toutes les 6 heures</option>
                <option value="12">Toutes les 12 heures</option>
                <option value="24">Toutes les 24 heures</option>
              </Select>
            </div>

            <ActionFeedback state={cronState} />
            <Button type="submit" color="primary" disabled={cronPending}>
              {cronPending ? "Enregistrement..." : "Enregistrer la fréquence"}
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-secondary-950 dark:text-white">
                Import manuel &amp; historique
              </h2>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Lancez une synchronisation immédiate ou consultez les derniers
                imports.
              </p>
            </div>
            <Button
              type="button"
              color="primary"
              disabled={!hasAnySource || isSyncing}
              onClick={handleManualSync}
            >
              {isSyncing ? "Import en cours..." : "Importer maintenant"}
            </Button>
          </div>

          <ActionFeedback state={syncState} />

          {runs.length === 0 ? (
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Aucun import enregistré pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-secondary-700 dark:text-secondary-300">
                <thead className="border-b border-secondary-200 text-xs uppercase text-secondary-500 dark:border-secondary-800 dark:text-secondary-400">
                  <tr>
                    <th scope="col" className="py-2 pr-4">
                      Source
                    </th>
                    <th scope="col" className="py-2 pr-4">
                      Statut
                    </th>
                    <th scope="col" className="py-2 pr-4">
                      Récupérées
                    </th>
                    <th scope="col" className="py-2 pr-4">
                      Ajoutées
                    </th>
                    <th scope="col" className="py-2 pr-4">
                      Mises à jour
                    </th>
                    <th scope="col" className="py-2 pr-4">
                      Dédupliquées
                    </th>
                    <th scope="col" className="py-2 pr-4">
                      Date
                    </th>
                    <th scope="col" className="py-2">
                      Erreur
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-200 dark:divide-secondary-800">
                  {runs.map((run) => {
                    const badge = STATUS_BADGE[run.status];
                    return (
                      <tr key={run.id}>
                        <td className="py-2 pr-4 font-medium text-secondary-950 dark:text-white">
                          {SOURCE_LABELS[run.source]}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge color={badge.color}>{badge.label}</Badge>
                        </td>
                        <td className="py-2 pr-4">{run.fetchedCount}</td>
                        <td className="py-2 pr-4">{run.insertedCount}</td>
                        <td className="py-2 pr-4">{run.updatedCount}</td>
                        <td className="py-2 pr-4">{run.dedupedCount}</td>
                        <td className="whitespace-nowrap py-2 pr-4">
                          {formatDate(run.startedAt)}
                        </td>
                        <td className="py-2 text-xs text-secondary-600 dark:text-secondary-400">
                          {run.errorMessage ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
