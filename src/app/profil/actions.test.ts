import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRevalidatePath,
  mockParseCvBuffer,
  mockParseCvStructured,
  mockLoadProfile,
  mockPersistProfile,
  mockUpsertCvAfterParse,
  mockRecomputeScores,
} = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
  mockParseCvBuffer: vi.fn(),
  mockParseCvStructured: vi.fn(),
  mockLoadProfile: vi.fn(),
  mockPersistProfile: vi.fn(),
  mockUpsertCvAfterParse: vi.fn(),
  mockRecomputeScores: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/lib/profile/cv-parse", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/profile/cv-parse")>();
  return {
    ...actual,
    parseCvBuffer: mockParseCvBuffer,
  };
});

vi.mock("@/lib/profile/cv-llm-parser", () => ({
  parseCvStructured: mockParseCvStructured,
}));

vi.mock("@/lib/profile/repository", () => ({
  getProfile: mockLoadProfile,
  saveProfile: mockPersistProfile,
  upsertCvAfterParse: mockUpsertCvAfterParse,
}));

vi.mock("@/lib/scoring/score-repository", () => ({
  recomputeScoresForAllOffers: mockRecomputeScores,
}));

import {
  applyStructuredCvToProfile,
  reanalyzeCvWithAi,
  uploadCv,
} from "./actions";

const baseProfile = {
  fullName: "",
  headline: "",
  email: "existing@example.com",
  phone: "",
  locationLabel: "",
  searchRadiusKm: 30,
  remotePreference: "flexible" as const,
  minSalaryAnnualGross: null,
  contractTypes: ["cdi"] as ("cdi")[],
  skills: [{ id: 1, label: "TypeScript", sortOrder: 0 }],
  experiences: [],
  cv: null,
};

const sampleStructured = {
  contact: {
    fullName: "Alice Martin",
    headline: "Ingénieure Backend",
    location: "Lyon",
    emails: ["alice@example.com"],
    phones: ["+33 6 12 34 56 78"],
    urls: ["github.com/alice"],
  },
  experiences: [
    {
      title: "Backend Dev",
      company: "Acme",
      startDate: "2022",
      endDate: "2024",
      highlights: ["Node.js APIs"],
    },
  ],
  education: [],
  skills: ["typescript", "PostgreSQL", "Docker"],
  softSkills: [],
  other: [],
};

describe("profil actions (M7-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploadCv runs hybrid parseCvStructured and persists layout + structured metadata", async () => {
    mockParseCvBuffer.mockResolvedValueOnce({
      ok: true,
      text: "Alice Martin\nTypeScript",
      mimeType: "application/pdf",
      layout: { isMultiColumn: true, pageCount: 2 },
    });
    mockParseCvStructured.mockResolvedValueOnce({
      structured: sampleStructured,
      mode: "llm",
    });
    mockLoadProfile.mockResolvedValueOnce(baseProfile);
    mockUpsertCvAfterParse.mockResolvedValueOnce({
      originalFilename: "cv.pdf",
      mimeType: "application/pdf",
      extractedText: "Alice Martin\nTypeScript",
      uploadedAt: new Date(),
      atsScore: 90,
      atsFindings: [],
      atsAnalyzedAt: new Date(),
      structuredSections: sampleStructured,
      parseMode: "llm",
      isMultiColumn: true,
      pageCount: 2,
    });

    const formData = new FormData();
    formData.set(
      "file",
      new File([Buffer.from("%PDF-1.4\n")], "cv.pdf", {
        type: "application/pdf",
      }),
    );

    const res = await uploadCv(formData);
    expect(res.ok).toBe(true);
    expect(mockUpsertCvAfterParse).toHaveBeenCalledWith(
      "cv.pdf",
      "application/pdf",
      "Alice Martin\nTypeScript",
      ["TypeScript"],
      "existing@example.com",
      "",
      {
        structured: sampleStructured,
        parseMode: "llm",
        layout: { isMultiColumn: true, pageCount: 2 },
      },
    );
    expect(mockRecomputeScores).toHaveBeenCalled();
  });

  it("reanalyzeCvWithAi returns error when no CV exists and re-analyzes when present", async () => {
    mockLoadProfile.mockResolvedValueOnce(baseProfile);
    const missing = await reanalyzeCvWithAi();
    expect(missing.ok).toBe(false);

    mockLoadProfile.mockResolvedValueOnce({
      ...baseProfile,
      cv: {
        originalFilename: "cv.pdf",
        mimeType: "application/pdf",
        extractedText: "CV text",
        uploadedAt: new Date(),
        atsScore: 70,
        atsFindings: [],
        atsAnalyzedAt: new Date(),
        structuredSections: null,
        parseMode: "deterministic",
        isMultiColumn: true,
        pageCount: 2,
      },
    });
    mockParseCvStructured.mockResolvedValueOnce({
      structured: sampleStructured,
      mode: "llm",
    });
    mockUpsertCvAfterParse.mockResolvedValueOnce({
      originalFilename: "cv.pdf",
      mimeType: "application/pdf",
      extractedText: "CV text",
      uploadedAt: new Date(),
      atsScore: 88,
      atsFindings: [],
      atsAnalyzedAt: new Date(),
      structuredSections: sampleStructured,
      parseMode: "llm",
      isMultiColumn: true,
      pageCount: 2,
    });

    const res = await reanalyzeCvWithAi();
    expect(res.ok).toBe(true);
    expect(mockUpsertCvAfterParse).toHaveBeenCalledWith(
      "cv.pdf",
      "application/pdf",
      "CV text",
      ["TypeScript"],
      "existing@example.com",
      "",
      {
        structured: sampleStructured,
        parseMode: "llm",
        layout: { isMultiColumn: true, pageCount: 2 },
      },
    );
    expect(mockRecomputeScores).toHaveBeenCalled();
  });

  it("applyStructuredCvToProfile overwrites existing profile fields with CV data and rescores offers", async () => {
    mockLoadProfile.mockResolvedValueOnce({
      ...baseProfile,
      fullName: "Ancien Nom",
      headline: "Ancien Titre",
      phone: "+33 6 00 00 00 00",
      locationLabel: "Marseille",
      skills: [{ id: 1, label: "OldSkill", sortOrder: 0 }],
      experiences: [
        {
          id: 10,
          title: "Old Job",
          company: "Old Co",
          location: "",
          startDate: "2019-01-01",
          endDate: "2020-01-01",
          description: "",
          sortOrder: 0,
        },
      ],
      cv: {
        originalFilename: "cv.pdf",
        mimeType: "application/pdf",
        extractedText: "CV text",
        uploadedAt: new Date(),
        atsScore: 88,
        atsFindings: [],
        atsAnalyzedAt: new Date(),
        structuredSections: sampleStructured,
        parseMode: "llm",
        isMultiColumn: false,
        pageCount: 1,
      },
    });

    const res = await applyStructuredCvToProfile();
    expect(res).toEqual({ ok: true });
    expect(mockPersistProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "Alice Martin",
        headline: "Ingénieure Backend",
        email: "alice@example.com",
        phone: "+33 6 12 34 56 78",
        locationLabel: "Lyon",
        skills: ["typescript", "PostgreSQL", "Docker"],
        experiences: [
          expect.objectContaining({
            title: "Backend Dev",
            company: "Acme",
            startDate: "2022-01-01",
            endDate: "2024-01-01",
          }),
        ],
      }),
    );
    expect(mockRecomputeScores).toHaveBeenCalled();
  });
});
