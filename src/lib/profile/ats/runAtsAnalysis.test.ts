import { describe, expect, it } from "vitest";

import { runAtsAnalysis } from "./runAtsAnalysis";

const baseCtx = {
  profileSkills: ["TypeScript", "React", "Node.js"],
  profileEmail: "",
  profilePhone: "",
};

const paddedCv = [
  "Expérience professionnelle",
  "Développeur — Société ABC — 2020-2023",
  "Réalisé des applications web avec React et TypeScript.",
  "Formation",
  "Master informatique — 2018",
  "Compétences: React, Node.js, SQL",
  "janvier 2020",
]
  .join("\n")
  .padEnd(500, " ");

describe("runAtsAnalysis", () => {
  it("fires TEXT_TOO_SHORT on short text", () => {
    const result = runAtsAnalysis("trop court", baseCtx);
    expect(result.findings.some((f) => f.code === "TEXT_TOO_SHORT")).toBe(true);
    expect(result.score).toBeLessThanOrEqual(80);
  });

  it("fires MISSING_EMAIL when CV and profile lack email", () => {
    const result = runAtsAnalysis(paddedCv, baseCtx);
    expect(result.findings.some((f) => f.code === "MISSING_EMAIL")).toBe(true);
  });

  it("fires SKILLS_COVERAGE_LOW when skills absent from CV", () => {
    const result = runAtsAnalysis(paddedCv, {
      ...baseCtx,
      profileSkills: ["Kubernetes", "Terraform", "AWS"],
    });
    expect(result.findings.some((f) => f.code === "SKILLS_COVERAGE_LOW")).toBe(
      true,
    );
  });

  it("uses structured CV for contact and structure rules to avoid false negatives on creative headings", () => {
    const creativeText = "Mon parcours\nVoici ce que j'ai fait.\n".padEnd(
      500,
      " ",
    );
    const result = runAtsAnalysis(creativeText, {
      ...baseCtx,
      structured: {
        contact: {
          emails: ["alice@example.com"],
          phones: ["06 12 34 56 78"],
          urls: [],
        },
        experiences: [
          {
            title: "Dev",
            company: "Acme",
            startDate: "2022",
            endDate: "2025",
            highlights: [],
          },
        ],
        education: [{ degree: "Master", school: "Univ", year: "2020" }],
        skills: ["TypeScript", "React", "Node.js"],
        softSkills: [],
        other: [],
      },
    });

    expect(result.findings.some((f) => f.code === "MISSING_EMAIL")).toBe(false);
    expect(result.findings.some((f) => f.code === "MISSING_PHONE")).toBe(false);
    expect(
      result.findings.some((f) => f.code === "MISSING_EXPERIENCE_SECTION"),
    ).toBe(false);
    expect(
      result.findings.some((f) => f.code === "MISSING_EDUCATION_SECTION"),
    ).toBe(false);
    expect(
      result.findings.some((f) => f.code === "MISSING_SKILLS_SECTION"),
    ).toBe(false);
    expect(result.findings.some((f) => f.code === "NO_DATES_DETECTED")).toBe(
      false,
    );
  });

  it("flags SUSPECTED_COLUMNS when layout.isMultiColumn is true and TOO_MANY_PAGES when pageCount > 2", () => {
    const result = runAtsAnalysis(paddedCv, {
      ...baseCtx,
      layout: { isMultiColumn: true, pageCount: 3 },
    });

    expect(result.findings.some((f) => f.code === "SUSPECTED_COLUMNS")).toBe(
      true,
    );
    expect(result.findings.some((f) => f.code === "TOO_MANY_PAGES")).toBe(true);
  });
});
