import type { ProfileUpdateInput } from "@/lib/profile/schemas";

export const REMOTE_PREFERENCE_LABELS: Record<
  ProfileUpdateInput["remotePreference"],
  string
> = {
  onsite: "Sur site",
  hybrid: "Hybride",
  remote: "Télétravail",
  flexible: "Flexible",
};

export const CONTRACT_TYPE_LABELS: Record<
  ProfileUpdateInput["contractTypes"][number],
  string
> = {
  cdi: "CDI",
  cdd: "CDD",
  alternance: "Alternance",
  freelance: "Freelance",
  interim: "Intérim",
  stage: "Stage",
};

export const CONTRACT_TYPE_OPTIONS = Object.entries(CONTRACT_TYPE_LABELS) as [
  ProfileUpdateInput["contractTypes"][number],
  string,
][];

export const REMOTE_PREFERENCE_OPTIONS = Object.entries(
  REMOTE_PREFERENCE_LABELS,
) as [ProfileUpdateInput["remotePreference"], string][];
