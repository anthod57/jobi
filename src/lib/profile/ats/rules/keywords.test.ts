import { describe, expect, it } from "vitest";

import type { AtsContext } from "../types";
import { keywordRules } from "./keywords";

const ctx: AtsContext = {
  profileSkills: ["Kubernetes", "Terraform", "AWS"],
  profileEmail: "",
  profilePhone: "",
};

describe("keywordRules", () => {
  it("fires SKILLS_COVERAGE_LOW when coverage is under 40%", () => {
    const findings = keywordRules.flatMap((rule) =>
      rule("CV with React only", ctx),
    );
    expect(findings.some((f) => f.code === "SKILLS_COVERAGE_LOW")).toBe(true);
  });
});
