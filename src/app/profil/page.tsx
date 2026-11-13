import { getProfile } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const profile = await getProfile();

  return (
    <main className="p-page">
      <h1 className="text-2xl font-semibold text-secondary-900 dark:text-white">
        Profil
      </h1>
      <p className="mt-2 text-secondary-600 dark:text-secondary-400">
        {profile.fullName || "Profil non renseigné"} —{" "}
        {profile.locationLabel || "lieu à définir"}
      </p>
      <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-500">
        {profile.skills.length} compétence(s) ·{" "}
        {profile.experiences.length} expérience(s)
        {profile.cv?.atsScore != null
          ? ` · Score ATS ${profile.cv.atsScore}`
          : ""}
      </p>
    </main>
  );
}
