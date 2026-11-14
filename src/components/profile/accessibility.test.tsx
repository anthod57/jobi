/**
 * @vitest-environment jsdom
 */
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AtsDisplay } from "@/components/profile/ats-display";
import { ExperiencesSection } from "@/components/profile/experiences-section";
import { renderWithTheme } from "@/test/render-ui";

describe("Profile accessibility (RGAA/WCAG)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders ATS severity headings at h3 level under Card h2", () => {
    renderWithTheme(
      <AtsDisplay
        cv={{
          originalFilename: "cv.pdf",
          mimeType: "application/pdf",
          extractedText: "Contenu CV",
          atsScore: 72,
          atsFindings: [
            {
              code: "missing_email",
              category: "contact",
              severity: "error",
              pointsDeducted: 5,
              message: "E-mail manquant.",
            },
          ],
          uploadedAt: new Date("2026-01-01T00:00:00.000Z"),
          atsAnalyzedAt: new Date("2026-01-01T00:00:00.000Z"),
        }}
      />,
    );

    const heading = screen.getByRole("heading", {
      level: 3,
      name: "Problèmes bloquants",
    });
    expect(heading).toBeInTheDocument();
  });

  it("gives each experience remove button a distinct accessible name", () => {
    renderWithTheme(
      <ExperiencesSection
        experiences={[
          {
            title: "Dev Fullstack",
            company: "Acme",
            location: "Paris",
            startDate: "2023-01-01",
            endDate: null,
            description: "Next.js",
            sortOrder: 0,
          },
          {
            title: "Dev Frontend",
            company: "Beta",
            location: "Lyon",
            startDate: "2021-01-01",
            endDate: "2022-12-31",
            description: "React",
            sortOrder: 1,
          },
        ]}
        onChange={() => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: /retirer l'expérience 1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /retirer l'expérience 2/i }),
    ).toBeInTheDocument();
  });
});
