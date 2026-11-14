"use client";

import { Alert, Badge } from "@/components/ui";
import {
  ATS_SEVERITY_ORDER,
  compareFindingsBySeverity,
  severityToAlertVariant,
} from "@/lib/profile/ats/ats-findings-order";
import { scoreBand } from "@/lib/profile/ats/score-band";
import type { AtsFinding } from "@/lib/profile/ats/types";
import {
  extractCvSections,
  type CvSectionKey,
} from "@/lib/profile/cv-sections";
import type { ProfileCvDto } from "@/lib/profile/repository";

const SEVERITY_HEADINGS: Record<AtsFinding["severity"], string> = {
  error: "Problèmes bloquants",
  warning: "Avertissements",
  info: "Informations",
};

const CV_SECTION_CONFIG: { key: CvSectionKey; label: string; asTags?: boolean }[] = [
  { key: "contact", label: "Contact" },
  { key: "skills", label: "Compétences", asTags: true },
  { key: "softSkills", label: "Soft-skills", asTags: true },
  { key: "experiences", label: "Expériences" },
  { key: "education", label: "Formation" },
  { key: "other", label: "Autres informations" },
];

type AtsDisplayProps = {
  cv: ProfileCvDto | null;
};

export function AtsDisplay({ cv }: AtsDisplayProps) {
  if (!cv) {
    return (
      <p className="text-sm text-secondary-600 dark:text-secondary-400">
        Importez un CV pour obtenir un score ATS.
      </p>
    );
  }

  const score = cv.atsScore ?? 0;
  const band = scoreBand(score);
  const findings = [...cv.atsFindings].sort(compareFindingsBySeverity);

  const grouped = ATS_SEVERITY_ORDER.map((severity) => ({
    severity,
    items: findings.filter((f) => f.severity === severity),
  })).filter((g) => g.items.length > 0);

  const sections = extractCvSections(cv.extractedText ?? "");
  const nonEmptySections = CV_SECTION_CONFIG.map((cfg) => ({
    ...cfg,
    items: sections[cfg.key],
  })).filter((s) => s.items.length > 0);

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
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Fichier : {cv.originalFilename}
        </p>
      ) : null}
      <div className="flex flex-col gap-stack" aria-live="polite">
        {grouped.length === 0 ? (
          <Alert variant="success">Aucun problème ATS détecté.</Alert>
        ) : (
          grouped.map((group) => (
            <section key={group.severity} aria-label={SEVERITY_HEADINGS[group.severity]}>
              <h3 className="mb-2 text-sm font-medium text-secondary-900 dark:text-white">
                {SEVERITY_HEADINGS[group.severity]}
              </h3>
              <ul className="flex flex-col gap-2">
                {group.items.map((finding) => (
                  <li key={finding.code}>
                    <Alert variant={severityToAlertVariant(finding.severity)}>
                      {finding.message}
                    </Alert>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
      {nonEmptySections.length > 0 ? (
        <section
          aria-label="Aperçu du CV extrait"
          className="border-t border-secondary-200 pt-4 dark:border-secondary-700"
        >
          <h3 className="mb-3 text-sm font-semibold text-secondary-900 dark:text-white">
            Aperçu du CV extrait
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {nonEmptySections.map((section) => (
              <div
                key={section.key}
                className="rounded-md border border-secondary-200 bg-secondary-50/50 p-3 dark:border-secondary-700 dark:bg-secondary-800/40"
              >
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-700 dark:text-secondary-300">
                  {section.label}
                </h4>
                {section.asTags ? (
                  <div className="flex flex-wrap gap-1.5">
                    {section.items.map((item) => (
                      <Badge key={item} color="info">
                        {item}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <ul className="flex flex-col gap-1 text-xs text-secondary-700 dark:text-secondary-300">
                    {section.items.map((item, idx) => (
                      <li key={`${section.key}-${idx}`} className="break-words">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
