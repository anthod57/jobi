import { describe, expect, it } from "vitest";

import type { AtsContext } from "../types";
import { formatRules } from "./format";

const emptyCtx: AtsContext = {
  profileSkills: [],
  profileEmail: "",
  profilePhone: "",
};

describe("formatRules", () => {
  it("returns no findings for plain prose above thresholds", () => {
    const text = "Développeur full-stack avec expérience solide en TypeScript.".repeat(
      20,
    );
    const findings = formatRules.flatMap((rule) => rule(text, emptyCtx));
    expect(findings.length).toBe(0);
  });
});
