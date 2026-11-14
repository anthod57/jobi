// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockReanalyzeCvWithAi, mockRefresh } = vi.hoisted(() => ({
  mockReanalyzeCvWithAi: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/app/profil/actions", () => ({
  reanalyzeCvWithAi: mockReanalyzeCvWithAi,
}));

import type { ProfileCvDto } from "@/lib/profile/repository";

import { AtsDisplay } from "./ats-display";

function makeCv(overrides: Partial<ProfileCvDto> = {}): ProfileCvDto {
  return {
    originalFilename: "cv-alice.pdf",
    mimeType: "application/pdf",
    extractedText: "Alice Martin\nalice@example.com",
    uploadedAt: new Date("2026-11-14T12:00:00Z"),
    atsScore: 90,
    atsFindings: [],
    atsAnalyzedAt: new Date("2026-11-14T12:00:00Z"),
    structuredSections: {
      contact: {
        fullName: "Alice Martin",
        headline: "Ingénieure Fullstack",
        location: "Lyon",
        emails: ["alice@example.com"],
        phones: ["06 12 34 56 78"],
        urls: ["https://github.com/alice"],
      },
      experiences: [
        {
          title: "Lead Dev",
          company: "Acme",
          startDate: "2022",
          endDate: "2025",
          highlights: ["Architecture Next.js", "Migration PostgreSQL"],
        },
      ],
      education: [
        {
          degree: "Master Informatique",
          school: "INSA Lyon",
          year: "2020",
        },
      ],
      skills: ["TypeScript", "React"],
      softSkills: ["Communication"],
      other: ["Anglais C1"],
    },
    parseMode: "llm",
    isMultiColumn: false,
    pageCount: 1,
    ...overrides,
  };
}

describe("AtsDisplay", () => {
  beforeEach(() => {
    mockReanalyzeCvWithAi.mockReset();
    mockRefresh.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders 'Analysé par IA' badge and rich structured sections when parseMode is llm", () => {
    render(<AtsDisplay cv={makeCv({ parseMode: "llm" })} hasLlmKey={true} />);

    expect(screen.getByText(/Analysé par IA/i)).toBeInTheDocument();
    expect(screen.getByText("Alice Martin")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Communication")).toBeInTheDocument();
    expect(screen.getByText(/Lead Dev/i)).toBeInTheDocument();
    expect(screen.getByText(/Acme/i)).toBeInTheDocument();
    expect(screen.getByText("Architecture Next.js")).toBeInTheDocument();
    expect(screen.getByText(/Master Informatique/i)).toBeInTheDocument();
    expect(screen.getByText(/INSA Lyon/i)).toBeInTheDocument();
    expect(screen.getByText("Anglais C1")).toBeInTheDocument();
  });

  it("renders 'Analyse locale (sans IA)' badge, LLM key note, and /parametres link when hasLlmKey is false", () => {
    render(
      <AtsDisplay
        cv={makeCv({ parseMode: "deterministic" })}
        hasLlmKey={false}
      />,
    );

    expect(screen.getByText(/Analyse locale \(sans IA\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Mistral, OpenAI ou Claude/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /paramètres/i });
    expect(link).toHaveAttribute("href", "/parametres");
    expect(
      screen.queryByRole("button", { name: /Réanalyser avec l'IA/i }),
    ).not.toBeInTheDocument();
  });

  it("renders 'Réanalyser avec l'IA' button when hasLlmKey is true and calls reanalyzeCvWithAi", async () => {
    mockReanalyzeCvWithAi.mockResolvedValue({
      ok: true,
      cv: makeCv({ parseMode: "llm" }),
    });

    render(
      <AtsDisplay
        cv={makeCv({ parseMode: "deterministic" })}
        hasLlmKey={true}
      />,
    );

    const btn = screen.getByRole("button", { name: /Réanalyser avec l'IA/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockReanalyzeCvWithAi).toHaveBeenCalledTimes(1);
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Analysé par IA/i)).toBeInTheDocument();
  });

  it("falls back to extractCvStructuredDeterministic when structuredSections is null", () => {
    const legacyCv = makeCv({
      structuredSections: null,
      parseMode: "deterministic",
      extractedText: [
        "Bob Dupont",
        "bob@example.com",
        "COMPÉTENCES",
        "Python, Docker",
        "EXPÉRIENCES",
        "Backend Engineer — BetaCorp (2021 - 2024)",
      ].join("\n"),
    });

    render(<AtsDisplay cv={legacyCv} hasLlmKey={false} />);

    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
    expect(screen.getByText(/Backend Engineer/i)).toBeInTheDocument();
  });
});
