import { describe, expect, it } from "vitest";

import { profileUpdateInputSchema } from "./schemas";

const validBase = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+33 6 12 34 56 78",
  locationLabel: "Paris",
  searchRadiusKm: 30,
  remotePreference: "hybrid" as const,
  minSalaryAnnualGross: null,
  contractTypes: ["cdi" as const],
  skills: ["TypeScript"],
  experiences: [
    {
      title: "Engineer",
      company: "Acme",
      startDate: "2020-01-01",
      endDate: null,
      description: "Built things.",
    },
  ],
};

describe("profileUpdateInputSchema", () => {
  it("accepts a valid profile payload", () => {
    const parsed = profileUpdateInputSchema.safeParse(validBase);
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown fields (strict)", () => {
    const parsed = profileUpdateInputSchema.safeParse({
      ...validBase,
      extra: true,
    });
    expect(parsed.success).toBe(false);
  });

  it("allows empty email string", () => {
    const parsed = profileUpdateInputSchema.safeParse({
      ...validBase,
      email: "",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid experience date format", () => {
    const parsed = profileUpdateInputSchema.safeParse({
      ...validBase,
      experiences: [{ ...validBase.experiences[0], startDate: "01/2020" }],
    });
    expect(parsed.success).toBe(false);
  });
});
