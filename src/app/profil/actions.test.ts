import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRevalidatePath, mockPersistProfile, mockRecomputeScores } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
  mockPersistProfile: vi.fn(),
  mockRecomputeScores: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/lib/profile/repository", () => ({
  getProfile: vi.fn(),
  saveProfile: mockPersistProfile,
  upsertCvAfterParse: vi.fn(),
}));

vi.mock("@/lib/scoring/score-repository", () => ({
  recomputeScoresForAllOffers: mockRecomputeScores,
}));

import { saveProfile } from "./actions";

describe("saveProfile", () => {
  beforeEach(() => {
    mockRevalidatePath.mockReset();
    mockPersistProfile.mockReset();
    mockRecomputeScores.mockReset();
  });

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

  it("persists valid profile, recomputes scores, and revalidates /profil and /offres", async () => {
    const input = {
      fullName: "Ada Lovelace",
      headline: "Staff Engineer",
      email: "ada@example.com",
      phone: "+33600000000",
      locationLabel: "Paris",
      searchRadiusKm: 30,
      remotePreference: "hybrid" as const,
      minSalaryAnnualGross: 60000,
      contractTypes: ["cdi" as const],
      skills: ["TypeScript"],
      experiences: [],
    };

    const result = await saveProfile(input);

    expect(result).toEqual({ ok: true });
    expect(mockPersistProfile).toHaveBeenCalledWith(input);
    expect(mockRecomputeScores).toHaveBeenCalledTimes(1);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/profil");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/offres");
  });
});
