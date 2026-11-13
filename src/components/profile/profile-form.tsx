"use client";

import { useState, type FormEvent } from "react";

import { saveProfile } from "@/app/profil/actions";
import { Alert, Button } from "@/components/ui";
import type { ProfileUpdateInput } from "@/lib/profile/schemas";
import type { ProfileDto } from "@/lib/profile/repository";

import { CvAtsSection } from "./cv-ats-section";
import { ExperiencesSection } from "./experiences-section";
import { IdentitySection } from "./identity-section";
import { PreferencesSection } from "./preferences-section";
import { profileToFormState } from "./profile-form-state";
import { SkillsSection } from "./skills-section";

type ProfileFormProps = {
  profile: ProfileDto;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [form, setForm] = useState<ProfileUpdateInput>(() =>
    profileToFormState(profile),
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    variant: "success" | "failure";
    text: string;
  } | null>(null);

  const patchForm = (patch: Partial<ProfileUpdateInput>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSaveMessage(null);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    const result = await saveProfile(form);
    setSaving(false);

    if (result.ok) {
      setSaveMessage({
        variant: "success",
        text: "Profil enregistré.",
      });
      return;
    }

    setSaveMessage({ variant: "failure", text: result.error });
  };

  return (
    <form onSubmit={onSubmit} className="pb-24">
      <div aria-live="polite">
        {saveMessage ? (
          <Alert variant={saveMessage.variant} className="mb-stack">
            {saveMessage.text}
          </Alert>
        ) : null}
      </div>

      <IdentitySection
        value={{
          fullName: form.fullName,
          headline: form.headline,
          email: form.email,
          phone: form.phone,
        }}
        onChange={patchForm}
      />

      <PreferencesSection
        value={{
          locationLabel: form.locationLabel,
          searchRadiusKm: form.searchRadiusKm,
          remotePreference: form.remotePreference,
          contractTypes: form.contractTypes,
          minSalaryAnnualGross: form.minSalaryAnnualGross,
        }}
        onChange={patchForm}
      />

      <SkillsSection
        skills={form.skills}
        onChange={(skills) => patchForm({ skills })}
      />

      <ExperiencesSection
        experiences={form.experiences}
        onChange={(experiences) => patchForm({ experiences })}
      />

      <CvAtsSection cv={profile.cv} />

      <div className="sticky bottom-0 mt-section border-t border-secondary-200 bg-white/95 py-4 backdrop-blur dark:border-secondary-700 dark:bg-secondary-900/95">
        <Button
          type="submit"
          color="primary"
          className="w-full sm:w-auto"
          isProcessing={saving}
          disabled={saving}
        >
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
