import type { Metadata } from "next";

import { ProfileForm } from "@/components/profile/profile-form";

import { getProfile } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon profil — Jobi",
};

export default async function ProfilPage() {
  const profile = await getProfile();

  return (
    <main className="p-page">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-secondary-900 dark:text-white">
          Mon profil
        </h1>
        <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
          Renseignez vos informations pour améliorer le ciblage des offres.
        </p>
        <ProfileForm profile={profile} />
      </div>
    </main>
  );
}
