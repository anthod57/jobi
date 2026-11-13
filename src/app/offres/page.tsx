import { BriefcaseIcon } from "@heroicons/react/24/outline";
import { count } from "drizzle-orm";
import type { Metadata } from "next";

import { triggerManualIngestionAction } from "@/app/parametres/actions";
import { Alert, Badge, Button, Card } from "@/components/ui";
import { listCredentialStatuses } from "@/lib/ingestion/credentials-repository";
import { getDb } from "@/server/db/client";
import { jobOffers } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Offres — Jobi",
};

export default async function OffresPage() {
  const db = getDb();
  const [[row], statuses] = await Promise.all([
    db.select({ total: count() }).from(jobOffers),
    listCredentialStatuses(),
  ]);

  const offerCount = Number(row?.total ?? 0);
  const hasConfiguredSource = statuses.some(
    (s) =>
      (s.provider === "france_travail" || s.provider === "adzuna") &&
      s.configured,
  );

  async function runManualImport() {
    "use server";
    await triggerManualIngestionAction();
  }

  return (
    <div className="space-y-section">
      <div className="flex flex-col gap-1 border-b border-secondary-200 pb-4 dark:border-secondary-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-secondary-950 dark:text-white">
            Offres
          </h1>
          <Badge color="primary">
            {offerCount} {offerCount > 1 ? "offres" : "offre"}
          </Badge>
        </div>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Centralisation, déduplication et scoring des offres d&apos;emploi.
        </p>
      </div>

      <Card>
        <div className="flex flex-col items-start gap-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-secondary-200 bg-secondary-50 text-secondary-600 dark:border-secondary-800 dark:bg-secondary-800 dark:text-secondary-300">
            <BriefcaseIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-secondary-950 dark:text-white">
              {offerCount > 0
                ? `${offerCount} offre${offerCount > 1 ? "s" : ""} importée${offerCount > 1 ? "s" : ""} en base`
                : "Aucune offre ingérée pour le moment"}
            </h2>
            <p className="max-w-lg text-sm text-secondary-600 dark:text-secondary-400">
              La liste filtrée et le scoring automatique arriveront dans la
              prochaine étape (M5).
            </p>
          </div>

          {hasConfiguredSource ? (
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
    </div>
  );
}
