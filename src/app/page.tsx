import Link from "next/link";

import { Alert, Badge, Button, Card } from "@/components/ui";

import { getHealthStatus } from "@/lib/health";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { body } = await getHealthStatus();
  const dbOk = body.checks.database === "ok";
  const dbLabel = dbOk
    ? "Base de données : OK"
    : "Base de données : indisponible";

  return (
    <div className="space-y-section">
      <div className="flex flex-col gap-1 border-b border-secondary-200 pb-4 dark:border-secondary-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-secondary-950 dark:text-white">
            Tableau de bord
          </h1>
          <Badge color={dbOk ? "success" : "failure"}>
            {dbOk ? "Opérationnel" : "Dégradé"}
          </Badge>
        </div>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Agrégateur d&apos;offres d&apos;emploi — instance locale pour suivre et
          candidater.
        </p>
      </div>

      <div className="grid gap-section md:grid-cols-2">
        <Card title="État de l'instance">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Vérification en direct de la connexion PostgreSQL locale.
          </p>
          <Alert variant={dbOk ? "success" : "failure"}>{dbLabel}</Alert>
          <div>
            <Link
              href="/api/health"
              className="text-sm font-medium text-primary-600 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 dark:text-primary-400"
            >
              Inspecter /api/health
            </Link>
          </div>
        </Card>

        <Card title="Configuration & accès rapides">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Renseignez votre profil et votre CV pour préparer le ciblage des
            offres et le suivi des candidatures.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href="/profil" color="primary">
              Compléter mon profil
            </Button>
            <Button href="/offres" color="gray">
              Voir les offres
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
