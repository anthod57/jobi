import { DocumentTextIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";

import { Badge, Button, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Candidatures — Jobi",
};

export default function CandidaturesPage() {
  return (
    <div className="space-y-section">
      <div className="flex flex-col gap-1 border-b border-secondary-200 pb-4 dark:border-secondary-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-secondary-950 dark:text-white">
            Candidatures
          </h1>
          <Badge color="primary">À venir</Badge>
        </div>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Suivi de vos candidatures et préparation des messages d&apos;approche.
        </p>
      </div>

      <Card>
        <div className="flex flex-col items-start gap-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-secondary-200 bg-secondary-50 text-secondary-600 dark:border-secondary-800 dark:bg-secondary-800 dark:text-secondary-300">
            <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-secondary-950 dark:text-white">
              Aucune candidature en cours
            </h2>
            <p className="max-w-lg text-sm text-secondary-600 dark:text-secondary-400">
              Le suivi des candidatures et la génération de brouillons
              personnalisés arriveront prochainement. Assurez-vous que votre CV
              et vos préférences sont à jour.
            </p>
          </div>
          <Button href="/profil" color="primary">
            Vérifier mon profil
          </Button>
        </div>
      </Card>
    </div>
  );
}
