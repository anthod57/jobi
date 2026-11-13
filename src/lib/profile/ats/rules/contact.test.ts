import { describe, expect, it } from "vitest";

import type { AtsContext } from "../types";
import { contactRules } from "./contact";

const emptyCtx: AtsContext = {
  profileSkills: [],
  profileEmail: "",
  profilePhone: "",
};

function runRules(text: string, ctx = emptyCtx) {
  return contactRules.flatMap((rule) => rule(text, ctx));
}

describe("contactRules", () => {
  it("fires MISSING_EMAIL when CV and profile lack email", () => {
    const codes = runRules("CV sans mail").map((f) => f.code);
    expect(codes).toContain("MISSING_EMAIL");
  });

  it("does not fire MISSING_EMAIL when profile has email", () => {
    const codes = runRules("CV sans mail", {
      ...emptyCtx,
      profileEmail: "a@example.com",
    }).map((f) => f.code);
    expect(codes).not.toContain("MISSING_EMAIL");
  });
});
