import { describe, expect, it } from "vitest";

import type { ProfileDto } from "@/lib/profile/repository";

import { profileToFormState } from "./profile-form-state";

describe("profileToFormState", () => {
  it("maps ProfileDto into ProfileUpdateInput shape", () => {
    const dto: ProfileDto = {
      fullName: "Ada",
      headline: "Dev",
      email: "a@example.com",
      phone: "0600000000",
      locationLabel: "Lyon",
      searchRadiusKm: 30,
      remotePreference: "hybrid",
      minSalaryAnnualGross: 45_000,
      contractTypes: ["cdi", "cdd"],
      skills: [
        { id: 1, label: "TypeScript", sortOrder: 0 },
        { id: 2, label: "React", sortOrder: 1 },
      ],
      experiences: [
        {
          id: 10,
          title: "Ingénieur",
          company: "ACME",
          location: "Lyon",
          startDate: "2020-01-01",
          endDate: null,
          description: "Ship features",
          sortOrder: 0,
        },
      ],
      cv: null,
    };

    const form = profileToFormState(dto);
    expect(form.fullName).toBe("Ada");
    expect(form.skills).toEqual(["TypeScript", "React"]);
    expect(form.contractTypes).toEqual(["cdi", "cdd"]);
    expect(form.experiences[0]?.title).toBe("Ingénieur");
    expect(form.experiences[0]?.sortOrder).toBe(0);
  });
});
