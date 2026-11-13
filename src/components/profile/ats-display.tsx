"use client";

import { Alert, Badge } from "@/components/ui";
import type { AtsFinding } from "@/lib/profile/ats/types";
import type { ProfileCvDto } from "@/lib/profile/repository";

function scoreBand(score: number): {
  label: string;
  color: "failure" | "warning" | "success" | "primary";
} {
  if (score < 50) {
    return { label: "Insuffisant", color: "failure" };
  }
  if (score < 75) {
    return { label: "Moyen", color: "warning" };
  }
  if (score < 90) {
    return { label: "Bon", color: "success" };
  }
  return { label: "Excellent", color: "primary" };
}

function severityVariant(
  severity: AtsFinding["severity"],
): "failure" | "warning" | "info" {
  if (severity === "error") return "failure";
  if (severity === "warning") return "warning";
  return "info";
}

const SEVERITY_ORDER: AtsFinding["severity"][] = [
  "error",
  "warning",
  "info",
];

const SEVERITY_HEADINGS: Record<AtsFinding["severity"], string> = {
  error: "Problèmes bloquants",
  warning: "Avertissements",
  info: "Informations",
};

type AtsDisplayProps = {
  cv: ProfileCvDto | null;
};

export function AtsDisplay({ cv }: AtsDisplayProps) {
  if (!cv) {
    return (
      <p className="text-sm text-secondary-500">
        Importez un CV pour obtenir un score ATS.
      </p>
    );
  }

  const score = cv.atsScore ?? 0;
  const band = scoreBand(score);
  const findings = [...cv.atsFindings].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );

  const grouped = SEVERITY_ORDER.map((severity) => ({
    severity,
    items: findings.filter((f) => f.severity === severity),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-stack">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-lg font-semibold text-secondary-900 dark:text-white">
          Score ATS : {score}
          <span className="sr-only"> sur 100</span>
        </p>
        <Badge color={band.color}>{band.label}</Badge>
      </div>
      {cv.originalFilename ? (
        <p className="text-sm text-secondary-500">
          Fichier : {cv.originalFilename}
        </p>
      ) : null}
      <div className="flex flex-col gap-stack" aria-live="polite">
        {grouped.length === 0 ? (
          <Alert variant="success">Aucun problème ATS détecté.</Alert>
        ) : (
          grouped.map((group) => (
            <section key={group.severity} aria-label={SEVERITY_HEADINGS[group.severity]}>
              <h4 className="mb-2 text-sm font-medium text-secondary-900 dark:text-white">
                {SEVERITY_HEADINGS[group.severity]}
              </h4>
              <ul className="flex flex-col gap-2">
                {group.items.map((finding) => (
                  <li key={finding.code}>
                    <Alert variant={severityVariant(finding.severity)}>
                      {finding.message}
                    </Alert>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
