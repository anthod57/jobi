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
});
