import type { ProfileUpdateInput } from "@/lib/profile/schemas";
import type { ProfileDto } from "@/lib/profile/repository";

export function profileToFormState(profile: ProfileDto): ProfileUpdateInput {
  return {
    fullName: profile.fullName,
    headline: profile.headline,
    email: profile.email,
    phone: profile.phone,
    locationLabel: profile.locationLabel,
    searchRadiusKm: profile.searchRadiusKm,
    remotePreference: profile.remotePreference,
    minSalaryAnnualGross: profile.minSalaryAnnualGross,
    contractTypes: [...profile.contractTypes],
    skills: profile.skills.map((s) => s.label),
    experiences: profile.experiences.map((e, index) => ({
      title: e.title,
      company: e.company,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      description: e.description,
      sortOrder: e.sortOrder ?? index,
    })),
  };
}
