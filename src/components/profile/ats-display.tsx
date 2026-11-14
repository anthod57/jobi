"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SparklesIcon } from "@heroicons/react/24/outline";

import { reanalyzeCvWithAi } from "@/app/profil/actions";
import { Alert, Badge, Button } from "@/components/ui";
import {
  ATS_SEVERITY_ORDER,
  compareFindingsBySeverity,
  severityToAlertVariant,
} from "@/lib/profile/ats/ats-findings-order";
import { scoreBand } from "@/lib/profile/ats/score-band";
import type { AtsFinding } from "@/lib/profile/ats/types";
import {
  extractCvStructuredDeterministic,
  type StructuredCv,
} from "@/lib/profile/cv-sections";
import type { ProfileCvDto } from "@/lib/profile/repository";

const SEVERITY_HEADINGS: Record<AtsFinding["severity"], string> = {
  error: "Problèmes bloquants",
  warning: "Avertissements",
  info: "Informations",
};

export type AtsDisplayProps = {
  cv: ProfileCvDto | null;
  hasLlmKey?: boolean;
};

function hasContactContent(contact: StructuredCv["contact"]): boolean {
  return Boolean(
    contact.fullName ||
      contact.headline ||
      contact.location ||
      contact.emails.length > 0 ||
      contact.phones.length > 0 ||
      contact.urls.length > 0,
  );
}

function hasStructuredContent(structured: StructuredCv): boolean {
  return (
    hasContactContent(structured.contact) ||
    structured.skills.length > 0 ||
    structured.softSkills.length > 0 ||
    structured.experiences.length > 0 ||
    structured.education.length > 0 ||
    structured.other.length > 0
  );
}

function StructuredPreview({ structured }: { structured: StructuredCv }) {
  if (!hasStructuredContent(structured)) return null;

  const { contact, skills, softSkills, experiences, education, other } =
    structured;

  return (
    <section
      aria-label="Aperçu du CV extrait"
      className="border-t border-secondary-200 pt-4 dark:border-secondary-700"
    >
      <h3 className="mb-3 text-sm font-semibold text-secondary-900 dark:text-white">
        Aperçu du CV extrait
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {hasContactContent(contact) ? (
          <div className="rounded-md border border-secondary-200 bg-secondary-50/50 p-3 dark:border-secondary-700 dark:bg-secondary-800/40">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-700 dark:text-secondary-300">
              Contact
            </h4>
            <ul className="flex flex-col gap-1 text-xs text-secondary-700 dark:text-secondary-300">
              {contact.fullName ? (
                <li className="font-medium text-secondary-900 dark:text-white">
                  {contact.fullName}
                </li>
              ) : null}
              {contact.headline ? <li>{contact.headline}</li> : null}
              {contact.location ? <li>{contact.location}</li> : null}
              {contact.emails.map((email) => (
                <li key={email} className="break-all">
                  {email}
                </li>
              ))}
              {contact.phones.map((phone) => (
                <li key={phone}>{phone}</li>
              ))}
              {contact.urls.map((url) => (
                <li key={url} className="break-all">
                  {url}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {skills.length > 0 ? (
          <div className="rounded-md border border-secondary-200 bg-secondary-50/50 p-3 dark:border-secondary-700 dark:bg-secondary-800/40">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-700 dark:text-secondary-300">
              Compétences
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((item) => (
                <Badge key={item} color="info">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {softSkills.length > 0 ? (
          <div className="rounded-md border border-secondary-200 bg-secondary-50/50 p-3 dark:border-secondary-700 dark:bg-secondary-800/40">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-700 dark:text-secondary-300">
              Soft-skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {softSkills.map((item) => (
                <Badge key={item} color="gray">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {experiences.length > 0 ? (
          <div className="rounded-md border border-secondary-200 bg-secondary-50/50 p-3 sm:col-span-2 dark:border-secondary-700 dark:bg-secondary-800/40">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-700 dark:text-secondary-300">
              Expériences
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-secondary-700 dark:text-secondary-300">
              {experiences.map((exp, idx) => (
                <li key={`${exp.title}-${exp.company}-${idx}`}>
                  <div className="font-medium text-secondary-900 dark:text-white">
                    {exp.title}
                    {exp.company ? ` — ${exp.company}` : ""}
                    {exp.startDate || exp.endDate
                      ? ` (${[exp.startDate, exp.endDate].filter(Boolean).join(" - ")})`
                      : ""}
                  </div>
                  {exp.highlights.length > 0 ? (
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      {exp.highlights.map((hl, hlIdx) => (
                        <li key={hlIdx} className="break-words">
                          {hl}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {education.length > 0 ? (
          <div className="rounded-md border border-secondary-200 bg-secondary-50/50 p-3 dark:border-secondary-700 dark:bg-secondary-800/40">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-700 dark:text-secondary-300">
              Formation
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs text-secondary-700 dark:text-secondary-300">
              {education.map((edu, idx) => (
                <li key={`${edu.degree}-${edu.school}-${idx}`}>
                  <span className="font-medium text-secondary-900 dark:text-white">
                    {edu.degree}
                  </span>
                  {edu.school ? ` — ${edu.school}` : ""}
                  {edu.year ? ` (${edu.year})` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {other.length > 0 ? (
          <div className="rounded-md border border-secondary-200 bg-secondary-50/50 p-3 dark:border-secondary-700 dark:bg-secondary-800/40">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-700 dark:text-secondary-300">
              Autres informations
            </h4>
            <ul className="flex flex-col gap-1 text-xs text-secondary-700 dark:text-secondary-300">
              {other.map((item, idx) => (
                <li key={`other-${idx}`} className="break-words">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function AtsDisplay({ cv, hasLlmKey = false }: AtsDisplayProps) {
  const router = useRouter();
  const [reanalyzedCv, setReanalyzedCv] = useState<ProfileCvDto | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeError, setReanalyzeError] = useState<string | null>(null);

  useEffect(() => {
    setReanalyzedCv(null);
  }, [cv]);

  const activeCv = reanalyzedCv ?? cv;

  if (!activeCv) {
    return (
      <p className="text-sm text-secondary-600 dark:text-secondary-400">
        Importez un CV pour obtenir un score ATS.
      </p>
    );
  }

  const onReanalyze = async () => {
    setReanalyzing(true);
    setReanalyzeError(null);
    try {
      const result = await reanalyzeCvWithAi();
      if (result.ok) {
        setReanalyzedCv(result.cv);
        router.refresh();
        return;
      }
      setReanalyzeError(result.error);
    } catch {
      setReanalyzeError("Impossible de réanalyser le CV.");
    } finally {
      setReanalyzing(false);
    }
  };

  const score = activeCv.atsScore ?? 0;
  const band = scoreBand(score);
  const findings = [...activeCv.atsFindings].sort(compareFindingsBySeverity);
  const isLlm = activeCv.parseMode === "llm";

  const grouped = ATS_SEVERITY_ORDER.map((severity) => ({
    severity,
    items: findings.filter((f) => f.severity === severity),
  })).filter((g) => g.items.length > 0);

  const structured =
    activeCv.structuredSections ??
    extractCvStructuredDeterministic(activeCv.extractedText ?? "");

  return (
    <div className="flex flex-col gap-stack">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-lg font-semibold text-secondary-900 dark:text-white">
          Score ATS : {score}
          <span className="sr-only"> sur 100</span>
        </p>
        <Badge color={band.color}>{band.label}</Badge>
        <Badge color={isLlm ? "purple" : "gray"}>
          {isLlm ? "Analysé par IA" : "Analyse locale (sans IA)"}
        </Badge>
        {hasLlmKey ? (
          <Button
            type="button"
            size="xs"
            color="light"
            isProcessing={reanalyzing}
            onClick={onReanalyze}
          >
            <SparklesIcon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Réanalyser avec l&apos;IA
          </Button>
        ) : (
          <Link
            href="/parametres"
            className="text-xs font-medium text-primary-600 underline hover:text-primary-700 dark:text-primary-400"
          >
            Configurer une clé IA dans les paramètres
          </Link>
        )}
      </div>

      {!isLlm ? (
        <p className="text-xs text-secondary-600 dark:text-secondary-400">
          Le parsing fonctionne sans clé API, mais une clé LLM (Mistral, OpenAI
          ou Claude) rend l&apos;extraction plus précise sur les CV atypiques.
        </p>
      ) : null}

      {reanalyzeError ? (
        <div aria-live="polite">
          <Alert variant="failure">{reanalyzeError}</Alert>
        </div>
      ) : null}

      {activeCv.originalFilename ? (
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Fichier : {activeCv.originalFilename}
        </p>
      ) : null}

      <div className="flex flex-col gap-stack" aria-live="polite">
        {grouped.length === 0 ? (
          <Alert variant="success">Aucun problème ATS détecté.</Alert>
        ) : (
          grouped.map((group) => (
            <section
              key={group.severity}
              aria-label={SEVERITY_HEADINGS[group.severity]}
            >
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

      <StructuredPreview structured={structured} />
    </div>
  );
}
