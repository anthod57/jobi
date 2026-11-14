// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockUploadCv, mockRefresh } = vi.hoisted(() => ({
  mockUploadCv: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/app/profil/actions", () => ({
  uploadCv: mockUploadCv,
}));

import { CvAtsSection } from "./cv-ats-section";

describe("CvAtsSection", () => {
  beforeEach(() => {
    mockUploadCv.mockReset();
    mockRefresh.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("uploads a PDF, displays returned ATS score and findings, and calls router.refresh", async () => {
    mockUploadCv.mockResolvedValue({
      ok: true,
      cv: {
        originalFilename: "cv-complete-modern.pdf",
        mimeType: "application/pdf",
        extractedText: [
          "Alice Martin",
          "alice@example.com",
          "COMPÉTENCES",
          "TypeScript, React",
          "SOFT-SKILLS",
          "Communication",
          "EXPÉRIENCES",
          "Dev — Acme (2022 - 2025)",
        ].join("\n"),
        uploadedAt: new Date("2026-11-14T12:00:00Z"),
        atsScore: 92,
        atsFindings: [],
        atsAnalyzedAt: new Date("2026-11-14T12:00:00Z"),
      },
    });

    render(<CvAtsSection cv={null} />);

    const input = screen.getByLabelText(/Fichier CV/i) as HTMLInputElement;
    const file = new File(["%PDF-1.4\n"], "cv-complete-modern.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: /Importer le CV/i }));

    await waitFor(() => {
      expect(screen.getByText(/CV importé et analysé\./i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Score ATS : 92/i)).toBeInTheDocument();
    expect(screen.getByText(/Fichier : cv-complete-modern\.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/Aperçu du CV extrait/i)).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Communication")).toBeInTheDocument();
    expect(screen.getByText("Dev — Acme (2022 - 2025)")).toBeInTheDocument();
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("recovers from unexpected uploadCv rejection and shows an error alert", async () => {
    mockUploadCv.mockRejectedValue(new Error("Server failure"));

    render(<CvAtsSection cv={null} />);

    const input = screen.getByLabelText(/Fichier CV/i) as HTMLInputElement;
    const file = new File(["%PDF-1.4\n"], "cv.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: /Importer le CV/i }));

    await waitFor(() => {
      expect(screen.getByText(/Impossible d'importer le CV\./i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Importer le CV/i })).not.toBeDisabled();
  });
});
