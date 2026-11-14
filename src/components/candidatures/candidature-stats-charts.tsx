import {
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
  LLM_PROVIDER_LABELS,
} from "@/components/candidatures/labels";
import { Badge, Card } from "@/components/ui";
import type {
  ApplicationStatus,
  CandidatureStats,
  LlmProvider,
} from "@/lib/candidatures/types";

export interface CandidatureStatsChartsProps {
  stats: CandidatureStats;
}

const STATUS_BAR_CLASS: Record<ApplicationStatus, string> = {
  draft: "fill-warning-500 dark:fill-warning-400",
  validated: "fill-primary-500 dark:fill-primary-400",
  sent: "fill-success-500 dark:fill-success-400",
  archived: "fill-secondary-400 dark:fill-secondary-500",
};

const PROVIDER_BAR_CLASS: Record<LlmProvider, string> = {
  mistral: "fill-primary-500 dark:fill-primary-400",
  openai: "fill-success-500 dark:fill-success-400",
  anthropic: "fill-warning-500 dark:fill-warning-400",
};

const STATUS_ORDER: readonly ApplicationStatus[] = [
  "draft",
  "validated",
  "sent",
  "archived",
];

export function CandidatureStatsCharts({ stats }: CandidatureStatsChartsProps) {
  const inProgress = stats.byStatus.draft + stats.byStatus.validated;
  const maxStatusCount = Math.max(
    1,
    ...STATUS_ORDER.map((status) => stats.byStatus[status]),
  );
  const maxProviderTokens = Math.max(
    1,
    ...stats.usageByProvider.map((item) => item.totalTokens),
  );

  return (
    <div className="space-y-section">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
            Total
          </p>
          <p className="mt-1 text-2xl font-semibold text-secondary-950 dark:text-white">
            {stats.totalApplications}
          </p>
        </Card>

        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
            En préparation
          </p>
          <p className="mt-1 text-2xl font-semibold text-primary-600 dark:text-primary-400">
            {inProgress}
          </p>
        </Card>

        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
            Envoyées
          </p>
          <p className="mt-1 text-2xl font-semibold text-success-600 dark:text-success-400">
            {stats.byStatus.sent}
          </p>
        </Card>

        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
            Coût LLM estimé
          </p>
          <p className="mt-1 text-2xl font-semibold text-secondary-950 dark:text-white">
            ${stats.totalCostUsd.toFixed(4)}
          </p>
          <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-400">
            {stats.totalTokens.toLocaleString("fr-FR")} tokens au total
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-secondary-950 dark:text-white">
              Répartition par statut
            </h2>

            <svg
              role="img"
              aria-label="Répartition des candidatures par statut"
              viewBox="0 0 400 136"
              className="h-36 w-full"
            >
              {STATUS_ORDER.map((status, idx) => {
                const count = stats.byStatus[status];
                const barWidth =
                  stats.totalApplications > 0
                    ? Math.round((count / maxStatusCount) * 230)
                    : 0;
                const y = idx * 32 + 6;
                return (
                  <g key={status} transform={`translate(0, ${y})`}>
                    <text
                      x="0"
                      y="15"
                      className="fill-secondary-700 text-xs font-medium dark:fill-secondary-300"
                    >
                      {APPLICATION_STATUS_LABELS[status]}
                    </text>
                    <rect
                      x="110"
                      y="3"
                      width="230"
                      height="16"
                      rx="4"
                      className="fill-secondary-100 dark:fill-secondary-800"
                    />
                    {barWidth > 0 ? (
                      <rect
                        x="110"
                        y="3"
                        width={barWidth}
                        height="16"
                        rx="4"
                        className={STATUS_BAR_CLASS[status]}
                      />
                    ) : null}
                    <text
                      x="352"
                      y="15"
                      className="fill-secondary-900 text-xs font-semibold dark:fill-white"
                    >
                      {count}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="flex flex-wrap gap-2">
              {STATUS_ORDER.map((status) => (
                <Badge key={status} color={APPLICATION_STATUS_COLORS[status]}>
                  {APPLICATION_STATUS_LABELS[status]} : {stats.byStatus[status]}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-secondary-950 dark:text-white">
                Consommation LLM par fournisseur
              </h2>
              <span className="text-xs text-secondary-600 dark:text-secondary-400">
                Prompt : {stats.totalPromptTokens.toLocaleString("fr-FR")} ·
                Complétion :{" "}
                {stats.totalCompletionTokens.toLocaleString("fr-FR")}
              </span>
            </div>

            {stats.usageByProvider.length === 0 ? (
              <div className="space-y-3">
                <svg
                  role="img"
                  aria-label="Consommation tokens et coût LLM par fournisseur"
                  viewBox="0 0 400 40"
                  className="h-10 w-full"
                >
                  <rect
                    x="0"
                    y="12"
                    width="400"
                    height="16"
                    rx="4"
                    className="fill-secondary-100 dark:fill-secondary-800"
                  />
                </svg>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Aucune consommation LLM enregistrée pour le moment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <svg
                  role="img"
                  aria-label="Consommation tokens et coût LLM par fournisseur"
                  viewBox={`0 0 440 ${Math.max(40, stats.usageByProvider.length * 36)}`}
                  className="w-full"
                >
                  {stats.usageByProvider.map((item, idx) => {
                    const barWidth = Math.round(
                      (item.totalTokens / maxProviderTokens) * 160,
                    );
                    const y = idx * 34 + 6;
                    return (
                      <g key={item.provider} transform={`translate(0, ${y})`}>
                        <text
                          x="0"
                          y="15"
                          className="fill-secondary-700 text-xs font-medium dark:fill-secondary-300"
                        >
                          {LLM_PROVIDER_LABELS[item.provider]}
                        </text>
                        <rect
                          x="95"
                          y="3"
                          width="160"
                          height="16"
                          rx="4"
                          className="fill-secondary-100 dark:fill-secondary-800"
                        />
                        {barWidth > 0 ? (
                          <rect
                            x="95"
                            y="3"
                            width={barWidth}
                            height="16"
                            rx="4"
                            className={PROVIDER_BAR_CLASS[item.provider]}
                          />
                        ) : null}
                        <text
                          x="265"
                          y="15"
                          className="fill-secondary-900 text-xs font-semibold dark:fill-white"
                        >
                          {item.totalTokens.toLocaleString("fr-FR")} · $
                          {item.costUsd.toFixed(4)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
