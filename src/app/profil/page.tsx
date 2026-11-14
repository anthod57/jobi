import type { Metadata } from "next";

import { CvQuickFillBanner } from "@/components/profile/cv-quick-fill-banner";
import { ProfileForm } from "@/components/profile/profile-form";
import { hasConfiguredLlmKey } from "@/lib/profile/cv-llm-parser";

import { getProfile } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon profil — Jobi",
};

export default async function ProfilPage() {
  const [profile, hasLlmKey] = await Promise.all([
    getProfile(),
    hasConfiguredLlmKey(),
  ]);

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
        <CvQuickFillBanner cv={profile.cv} hasLlmKey={hasLlmKey} />
        <ProfileForm profile={profile} hasLlmKey={hasLlmKey} />
      </div>
    </div>
  );
}
