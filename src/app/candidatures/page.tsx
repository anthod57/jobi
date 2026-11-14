import { DocumentTextIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import Link from "next/link";

import { ApplicationCard } from "@/components/candidatures/application-card";
import { CandidatureStatsCharts } from "@/components/candidatures/candidature-stats-charts";
import { APPLICATION_STATUS_LABELS } from "@/components/candidatures/labels";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import {
  getCandidatureStats,
  listApplications,
} from "@/lib/candidatures/repository";
import { applicationFiltersSchema } from "@/lib/candidatures/schemas";
import type { ApplicationStatus } from "@/lib/candidatures/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidatures — Jobi",
};

const STATUS_OPTIONS: readonly ApplicationStatus[] = [
  "draft",
  "validated",
  "sent",
  "archived",
];

type CandidaturesPageProps = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

export default async function CandidaturesPage({
  searchParams,
}: CandidaturesPageProps) {
  const rawParams = await searchParams;
  const parsed = applicationFiltersSchema.safeParse({
    status: rawParams.status || undefined,
    q: rawParams.q ?? "",
  });

  const filters = parsed.success
    ? parsed.data
    : { status: undefined, q: "" };

  const [stats, applications] = await Promise.all([
    getCandidatureStats(),
    listApplications({ status: filters.status, q: filters.q }),
  ]);

  return (
    <div className="space-y-section">
      <div className="flex flex-col gap-1 border-b border-secondary-200 pb-4 dark:border-secondary-800">
        <h1 className="text-2xl font-semibold tracking-tight text-secondary-950 dark:text-white">
          Candidatures
        </h1>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Suivi de vos candidatures, brouillons générés et consommation LLM.
        </p>
      </div>

      <CandidatureStatsCharts stats={stats} />

      <Card>
        <form
          method="GET"
          action="/candidatures"
          className="flex flex-wrap items-end gap-4"
        >
          <div className="w-full sm:w-48">
            <Label htmlFor="filter-status" className="mb-1.5 block">
              Statut
            </Label>
            <Select
              id="filter-status"
              name="status"
              defaultValue={filters.status ?? ""}
            >
              <option value="">Toutes</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {APPLICATION_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-full sm:min-w-[220px] sm:flex-1">
            <Label htmlFor="filter-q" className="mb-1.5 block">
              Rechercher
            </Label>
            <Input
              id="filter-q"
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="Poste, entreprise ou objet..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" color="primary">
              Filtrer
            </Button>
            {filters.status || filters.q ? (
              <Link
                href="/candidatures"
                className="text-sm font-medium text-secondary-600 hover:underline dark:text-secondary-400"
              >
                Réinitialiser
              </Link>
            ) : null}
          </div>
        </form>
      </Card>

      {applications.length === 0 ? (
        <Card>
          <div className="flex flex-col items-start gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-secondary-200 bg-secondary-50 text-secondary-600 dark:border-secondary-800 dark:bg-secondary-800 dark:text-secondary-300">
              <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-secondary-950 dark:text-white">
                {filters.status || filters.q
                  ? "Aucune candidature ne correspond à ces filtres"
                  : "Aucune candidature en cours"}
              </h2>
              <p className="max-w-lg text-sm text-secondary-600 dark:text-secondary-400">
                Ouvrez une offre depuis la liste des offres pour générer votre
                premier brouillon de candidature personnalisé.
              </p>
            </div>
            <Button href="/offres" color="primary">
              Parcourir les offres
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}
    </div>
  );
}
