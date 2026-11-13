"use client";

import { Card, Checkbox, Input, Label, Select } from "@/components/ui";
import type { ProfileUpdateInput } from "@/lib/profile/schemas";

import {
  CONTRACT_TYPE_OPTIONS,
  REMOTE_PREFERENCE_OPTIONS,
} from "./labels";

type PreferencesSectionProps = {
  value: Pick<
    ProfileUpdateInput,
    | "locationLabel"
    | "searchRadiusKm"
    | "remotePreference"
    | "contractTypes"
    | "minSalaryAnnualGross"
  >;
  onChange: (
    patch: Partial<
      Pick<
        ProfileUpdateInput,
        | "locationLabel"
        | "searchRadiusKm"
        | "remotePreference"
        | "contractTypes"
        | "minSalaryAnnualGross"
      >
    >,
  ) => void;
};

export function PreferencesSection({
  value,
  onChange,
}: PreferencesSectionProps) {
  const toggleContract = (
    type: ProfileUpdateInput["contractTypes"][number],
    checked: boolean,
  ) => {
    const next = checked
      ? [...value.contractTypes, type]
      : value.contractTypes.filter((t) => t !== type);
    onChange({ contractTypes: next });
  };

  return (
    <Card title="Préférences de recherche" className="mt-section">
      <div className="flex flex-col gap-stack">
        <div>
          <Label htmlFor="profile-location" value="Zone de recherche" />
          <Input
            id="profile-location"
            className="mt-2"
            value={value.locationLabel}
            onChange={(e) => onChange({ locationLabel: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="profile-radius" value="Rayon (km)" />
          <Input
            id="profile-radius"
            type="number"
            min={0}
            max={500}
            className="mt-2"
            value={value.searchRadiusKm}
            onChange={(e) =>
              onChange({
                searchRadiusKm: Number.parseInt(e.target.value, 10) || 0,
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="profile-remote" value="Présentiel / télétravail" />
          <Select
            id="profile-remote"
            className="mt-2"
            value={value.remotePreference}
            onChange={(e) =>
              onChange({
                remotePreference: e.target
                  .value as ProfileUpdateInput["remotePreference"],
              })
            }
          >
            {REMOTE_PREFERENCE_OPTIONS.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-secondary-900 dark:text-white">
            Types de contrat
          </legend>
          <div className="flex flex-col gap-2">
            {CONTRACT_TYPE_OPTIONS.map(([type, label]) => {
              const id = `profile-contract-${type}`;
              const checked = value.contractTypes.includes(type);
              return (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={checked}
                    onChange={(e) => toggleContract(type, e.target.checked)}
                  />
                  <Label htmlFor={id} value={label} />
                </div>
              );
            })}
          </div>
        </fieldset>
        <div>
          <Label
            htmlFor="profile-salary"
            value="Salaire minimum annuel brut (€, optionnel)"
          />
          <Input
            id="profile-salary"
            type="number"
            min={0}
            className="mt-2"
            value={value.minSalaryAnnualGross ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              onChange({
                minSalaryAnnualGross:
                  raw === "" ? null : Number.parseInt(raw, 10) || null,
              });
            }}
          />
        </div>
      </div>
    </Card>
  );
}
