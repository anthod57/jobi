import { BriefcaseIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";

import { Badge, Button, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Offres — Jobi",
};

export default function OffresPage() {
  return (
    <div className="space-y-section">
      <div className="flex flex-col gap-1 border-b border-secondary-200 pb-4 dark:border-secondary-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-secondary-950 dark:text-white">
            Offres
          </h1>
          <Badge color="primary">À venir</Badge>
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
              Aucune offre ingérée pour le moment
            </h2>
            <p className="max-w-lg text-sm text-secondary-600 dark:text-secondary-400">
              L&apos;ingestion et le classement automatique des offres seront
              disponibles dans la prochaine étape. En attendant, préparez votre
              profil pour optimiser le futur scoring.
            </p>
          </div>
          <Button href="/profil" color="primary">
            Configurer mon profil
          </Button>
        </div>
      </Card>
    </div>
  );
}
