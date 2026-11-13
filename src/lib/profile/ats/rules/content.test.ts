import { describe, expect, it } from "vitest";

import type { AtsContext } from "../types";
import { contentRules } from "./content";

const emptyCtx: AtsContext = {
  profileSkills: [],
  profileEmail: "",
  profilePhone: "",
};

describe("contentRules", () => {
  it("fires TEXT_TOO_SHORT below 450 characters", () => {
    const findings = contentRules.flatMap((rule) => rule("short", emptyCtx));
    expect(findings.some((f) => f.code === "TEXT_TOO_SHORT")).toBe(true);
  });
});
