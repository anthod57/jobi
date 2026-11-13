import { describe, expect, it } from "vitest";

import type { AtsContext } from "../types";
import { dateRules } from "./dates";

const emptyCtx: AtsContext = {
  profileSkills: [],
  profileEmail: "",
  profilePhone: "",
};

describe("dateRules", () => {
  it("fires NO_DATES_DETECTED when text has no dates", () => {
    const findings = dateRules.flatMap((rule) =>
      rule("parcours sans date", emptyCtx),
    );
    expect(findings.some((f) => f.code === "NO_DATES_DETECTED")).toBe(true);
  });
});
