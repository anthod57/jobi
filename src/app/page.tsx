import { getHealthStatus } from "@/lib/health";

export default async function Home() {
  const { body } = await getHealthStatus();
  const dbLabel =
    body.checks.database === "ok"
      ? "Base de données : OK"
      : "Base de données : indisponible";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold">Jobi</h1>
      <p className="text-lg text-zinc-600">
        Agrégateur d&apos;offres d&apos;emploi — instance locale.
      </p>
      <p className="text-base">{dbLabel}</p>
    </main>
  );
}
