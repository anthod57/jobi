import { BriefcaseIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";

import { triggerManualIngestionAction } from "@/app/parametres/actions";
import { OfferCard } from "@/components/offers/offer-card";
import { OfferFiltersBar } from "@/components/offers/offer-filters-bar";
import { Alert, Badge, Button, Card } from "@/components/ui";
import { listCredentialStatuses } from "@/lib/ingestion/credentials-repository";
import { offerFiltersSchema, type OfferFilters } from "@/lib/scoring/schemas";
import { listScoredOffers } from "@/lib/scoring/score-repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Offres — Jobi",
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseOfferFilters(
  raw: Record<string, string | string[] | undefined>,
): OfferFilters {
  const normalized = {
    q: firstParam(raw.q) || undefined,
    contractType: firstParam(raw.contractType) || undefined,
    remoteMode: firstParam(raw.remoteMode) || undefined,
    source: firstParam(raw.source) || undefined,
    minScore: firstParam(raw.minScore) || undefined,
    sort: firstParam(raw.sort) || undefined,
    page: firstParam(raw.page) || undefined,
  };
  const parsed = offerFiltersSchema.safeParse(normalized);
  return parsed.success ? parsed.data : offerFiltersSchema.parse({});
}

function buildPageHref(filters: OfferFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.contractType) params.set("contractType", filters.contractType);
  if (filters.remoteMode) params.set("remoteMode", filters.remoteMode);
  if (filters.source) params.set("source", filters.source);
  if (filters.minScore !== undefined) {
    params.set("minScore", String(filters.minScore));
  }
  if (filters.sort !== "score") params.set("sort", filters.sort);
  if (page > 1) params.set("page", String(page));

  const qs = params.toString();
  return qs ? `/offres?${qs}` : "/offres";
}

export default async function OffresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const filters = parseOfferFilters(rawParams);

  const [result, statuses] = await Promise.all([
    listScoredOffers(filters),
    listCredentialStatuses(),
  ]);

  const hasConfiguredSource = statuses.some(
    (s) =>
      (s.provider === "france_travail" || s.provider === "adzuna") &&
      s.configured,
  );

  const hasActiveFilters = Boolean(
    filters.q ||
      filters.contractType ||
      filters.remoteMode ||
      filters.source ||
      filters.minScore !== undefined,
  );

  const isEmptyProfile =
    result.items.length > 0 &&
    (result.items.some((item) => item.breakdown?.isEmptyProfile) ||
      result.items.every((item) => item.score === null));

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  async function runManualImport() {
    "use server";
    await triggerManualIngestionAction();
  }

  return (
    <div className="space-y-section">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-secondary-200 pb-4 dark:border-secondary-800">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-secondary-950 dark:text-white">
              Offres
            </h1>
            <Badge color="primary">
              {result.total} {result.total > 1 ? "offres" : "offre"}
            </Badge>
          </div>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Offres centralisées, dédupliquées et classées par compatibilité avec
            votre profil.
          </p>
        </div>

        {hasConfiguredSource ? (
          <form action={runManualImport}>
            <Button type="submit" color="light" size="sm">
              Importer maintenant
            </Button>
          </form>
        ) : null}
      </div>

      {isEmptyProfile ? (
        <Alert variant="info">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Votre profil est vide ou incomplet : complétez-le pour calculer le
              score de compatibilité des offres.
            </span>
            <Button href="/profil" color="primary" size="sm">
              Compléter mon profil
            </Button>
          </div>
        </Alert>
      ) : null}

      <OfferFiltersBar key={JSON.stringify(filters)} filters={filters} />

      {result.items.length === 0 ? (
        <Card>
          <div className="flex flex-col items-start gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-secondary-200 bg-secondary-50 text-secondary-600 dark:border-secondary-800 dark:bg-secondary-800 dark:text-secondary-300">
              <BriefcaseIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-secondary-950 dark:text-white">
                {hasActiveFilters
                  ? "Aucune offre ne correspond à vos filtres"
                  : "Aucune offre ingérée pour le moment"}
              </h2>
              <p className="max-w-lg text-sm text-secondary-600 dark:text-secondary-400">
                {hasActiveFilters
                  ? "Essayez d'élargir votre recherche ou de réinitialiser les filtres."
                  : "Configurez une source ou lancez un import pour remplir la liste d'offres."}
              </p>
            </div>

            {hasActiveFilters ? (
              <Button href="/offres" color="light">
                Réinitialiser les filtres
              </Button>
            ) : hasConfiguredSource ? (
              <div className="flex flex-wrap items-center gap-3">
                <form action={runManualImport}>
                  <Button type="submit" color="primary">
                    Importer maintenant
                  </Button>
                </form>
                <Button href="/parametres" color="light">
                  Gérer les sources
                </Button>
              </div>
            ) : (
              <div className="w-full max-w-lg space-y-3">
                <Alert variant="info">
                  Aucune source d&apos;offres n&apos;est configurée. Renseignez
                  vos clés France Travail ou Adzuna pour lancer l&apos;import.
                </Alert>
                <Button href="/parametres" color="primary">
                  Configurer dans Paramètres
                </Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="space-y-4">
            {result.items.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              aria-label="Pagination des offres"
              className="flex flex-wrap items-center justify-between gap-3 pt-2"
            >
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Page {result.page} sur {totalPages}
              </p>
              <div className="flex items-center gap-2">
                {result.page > 1 ? (
                  <Button
                    href={buildPageHref(filters, result.page - 1)}
                    color="light"
                    size="sm"
                  >
                    Précédent
                  </Button>
                ) : (
                  <Button color="light" size="sm" disabled>
                    Précédent
                  </Button>
                )}
                {result.page < totalPages ? (
                  <Button
                    href={buildPageHref(filters, result.page + 1)}
                    color="light"
                    size="sm"
                  >
                    Suivant
                  </Button>
                ) : (
                  <Button color="light" size="sm" disabled>
                    Suivant
                  </Button>
                )}
              </div>
            </nav>
          ) : null}
        </div>
      )}
    </div>
  );
}
