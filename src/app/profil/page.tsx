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
    <div className="mx-auto max-w-3xl">
      <div className="border-b border-secondary-200 pb-4 dark:border-secondary-800">
        <h1 className="text-2xl font-semibold tracking-tight text-secondary-950 dark:text-white">
          Mon profil
        </h1>
        <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
          Renseignez vos informations pour améliorer le ciblage des offres.
        </p>
      </div>
      <div className="mt-section">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
