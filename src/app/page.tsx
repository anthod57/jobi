import Link from "next/link";

import { Alert, Card } from "@/components/ui";

import { getHealthStatus } from "@/lib/health";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { body } = await getHealthStatus();
  const dbOk = body.checks.database === "ok";
  const dbLabel = dbOk
    ? "Base de données : OK"
    : "Base de données : indisponible";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-page">
      <Card title="Jobi" className="w-full max-w-md">
        <p className="text-lg text-secondary-600 dark:text-secondary-400">
          Agrégateur d&apos;offres d&apos;emploi — instance locale.
        </p>
        <Alert variant={dbOk ? "success" : "failure"} className="mt-stack">
          {dbLabel}
        </Alert>
        <p className="mt-stack">
          <Link
            href="/profil"
            className="font-medium text-primary-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-400"
          >
            Mon profil
          </Link>
        </p>
      </Card>
    </main>
  );
}
