import { Alert, Badge, Button, Card } from "@/components/ui";
import type { CriterionStatus, ScoreBreakdown } from "@/lib/scoring/types";

import { CRITERION_STATUS_LABELS, SCORE_CRITERION_LABELS } from "./labels";
import { ScoreBadge } from "./score-badge";

export interface ScoreBreakdownCardProps {
  score: number | null;
  breakdown: ScoreBreakdown | null;
}

const STATUS_BADGE_COLORS: Record<
  CriterionStatus,
  "success" | "warning" | "failure" | "gray"
> = {
  matched: "success",
  partial: "warning",
  mismatch: "failure",
  neutral: "gray",
};

export function ScoreBreakdownCard({
  score,
  breakdown,
}: ScoreBreakdownCardProps) {
  return (
    <Card>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-secondary-200 pb-3 dark:border-secondary-800">
          <h2 className="text-lg font-semibold text-secondary-950 dark:text-white">
            Explication du score
          </h2>
          <ScoreBadge score={score} />
        </div>

        {!breakdown || breakdown.isEmptyProfile ? (
          <div className="flex flex-col items-start gap-3">
            <Alert variant="info" className="w-full">
              Complétez votre profil (titre cible, compétences ou préférences)
              pour calculer un score de compatibilité détaillé.
            </Alert>
            <Button href="/profil" color="primary" size="sm" className="w-fit">
              Compléter mon profil
            </Button>
          </div>
        ) : (
          <>
            {(breakdown.matchedSkills.length > 0 ||
              breakdown.missingSkills.length > 0) && (
              <div className="space-y-3">
                {breakdown.matchedSkills.length > 0 ? (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                      Compétences correspondantes
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {breakdown.matchedSkills.map((skill) => (
                        <Badge key={skill} color="success">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {breakdown.missingSkills.length > 0 ? (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                      Compétences non détectées
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {breakdown.missingSkills.map((skill) => (
                        <Badge key={skill} color="gray">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                Détail par critère
              </h3>
              <ul className="divide-y divide-secondary-200 dark:divide-secondary-800">
                {breakdown.criteria.map((criterion) => (
                  <li
                    key={criterion.key}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium text-secondary-950 dark:text-white">
                        {SCORE_CRITERION_LABELS[criterion.key]}
                      </p>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400">
                        {criterion.detail}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {criterion.score !== null ? (
                        <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400">
                          {criterion.score} %
                        </span>
                      ) : null}
                      <Badge color={STATUS_BADGE_COLORS[criterion.status]}>
                        {CRITERION_STATUS_LABELS[criterion.status]}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
