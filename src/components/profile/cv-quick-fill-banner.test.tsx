// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockUploadCv, mockApplyStructuredCvToProfile, mockRefresh } =
  vi.hoisted(() => ({
    mockUploadCv: vi.fn(),
    mockApplyStructuredCvToProfile: vi.fn(),
    mockRefresh: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/app/profil/actions", () => ({
  uploadCv: mockUploadCv,
  applyStructuredCvToProfile: mockApplyStructuredCvToProfile,
}));

import type { ProfileCvDto } from "@/lib/profile/repository";

import { CvQuickFillBanner } from "./cv-quick-fill-banner";

function makeCv(overrides: Partial<ProfileCvDto> = {}): ProfileCvDto {
  return {
    originalFilename: "cv-alice.pdf",
    mimeType: "application/pdf",
    extractedText: "Alice Martin\nTypeScript",
    uploadedAt: new Date("2026-11-14T12:00:00Z"),
    atsScore: 88,
    atsFindings: [],
    atsAnalyzedAt: new Date("2026-11-14T12:00:00Z"),
    structuredSections: {
      contact: {
        fullName: "Alice Martin",
        headline: "Développeuse Fullstack",
        location: "Paris",
        emails: ["alice@example.com"],
        phones: [],
        urls: [],
      },
      experiences: [
        {
          title: "Dev",
          company: "Acme",
          startDate: "2022",
          endDate: "2025",
          highlights: ["React"],
        },
      ],
      education: [],
      skills: ["TypeScript", "React"],
      softSkills: ["Communication"],
      other: [],
    },
    parseMode: "deterministic",
    isMultiColumn: false,
    pageCount: 1,
    ...overrides,
  };
}

describe("CvQuickFillBanner", () => {
  beforeEach(() => {
    mockUploadCv.mockReset();
    mockApplyStructuredCvToProfile.mockReset();
    mockRefresh.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("uploads a CV quickly, announces feedback in aria-live='polite', and calls router.refresh", async () => {
    mockUploadCv.mockResolvedValue({
      ok: true,
      cv: makeCv({ originalFilename: "nouveau-cv.pdf" }),
    });

    const { container } = render(
      <CvQuickFillBanner cv={null} hasLlmKey={false} />,
    );

    const input = screen.getByLabelText(/Importer un CV/i) as HTMLInputElement;
    const file = new File(["%PDF-1.4\n"], "nouveau-cv.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: /Importer le CV/i }));

    await waitFor(() => {
      expect(mockUploadCv).toHaveBeenCalledTimes(1);
    });

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    await waitFor(() => {
      expect(liveRegion?.textContent).toMatch(/CV importé/i);
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: /Remplir mon profil depuis le CV/i }),
    ).toBeEnabled();
  });

  it("applies structured CV to profile, shows aria-live feedback, and calls router.refresh", async () => {
    mockApplyStructuredCvToProfile.mockResolvedValue({ ok: true });

    const { container } = render(
      <CvQuickFillBanner cv={makeCv()} hasLlmKey={true} />,
    );

    expect(screen.getByText(/cv-alice\.pdf/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Remplir mon profil depuis le CV/i }),
    );

    await waitFor(() => {
      expect(mockApplyStructuredCvToProfile).toHaveBeenCalledTimes(1);
    });

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    await waitFor(() => {
      expect(liveRegion?.textContent).toMatch(/Profil pré-rempli/i);
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("displays an error in aria-live='polite' when applyStructuredCvToProfile fails", async () => {
    mockApplyStructuredCvToProfile.mockResolvedValue({
      ok: false,
      error: "Aucune donnée structurée de CV disponible.",
    });

    const { container } = render(
      <CvQuickFillBanner cv={makeCv()} hasLlmKey={false} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Remplir mon profil depuis le CV/i }),
    );

    await waitFor(() => {
      expect(mockApplyStructuredCvToProfile).toHaveBeenCalledTimes(1);
    });

    const liveRegion = container.querySelector('[aria-live="polite"]');
    await waitFor(() => {
      expect(liveRegion?.textContent).toMatch(
        /Aucune donnée structurée de CV disponible\./i,
      );
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
