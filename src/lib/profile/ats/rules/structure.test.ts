import { describe, expect, it } from "vitest";

import type { AtsContext } from "../types";
import { structureRules } from "./structure";

const emptyCtx: AtsContext = {
  profileSkills: [],
  profileEmail: "",
  profilePhone: "",
};

describe("structureRules", () => {
  it("fires MISSING_EXPERIENCE_SECTION without experience keywords", () => {
    const findings = structureRules.flatMap((rule) =>
      rule("liste de compétences uniquement", emptyCtx),
    );
    expect(
      findings.some((f) => f.code === "MISSING_EXPERIENCE_SECTION"),
    ).toBe(true);
  });
});
