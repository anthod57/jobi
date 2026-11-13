import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/profile/repository", () => ({
  getProfile: vi.fn(),
  saveProfile: vi.fn(),
  upsertCvAfterParse: vi.fn(),
}));

import { saveProfile } from "./actions";

describe("saveProfile", () => {
  it("returns error when input fails schema validation", async () => {
    const result = await saveProfile({
      fullName: "",
      email: "not-an-email",
      phone: "",
      locationLabel: "",
      searchRadiusKm: -1,
      remotePreference: "hybrid",
      minSalaryAnnualGross: null,
      contractTypes: [],
      skills: [],
      experiences: [],
    } as never);
    expect(result).toEqual({ ok: false, error: "Données du profil invalides." });
  });
});
