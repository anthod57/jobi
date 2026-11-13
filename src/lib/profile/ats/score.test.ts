import { describe, expect, it } from "vitest";

import { scoreFromFindings } from "./score";
import type { AtsFinding } from "./types";

describe("scoreFromFindings", () => {
  it("clamps score between 0 and 100", () => {
    const heavy: AtsFinding[] = [
      {
        code: "A",
        severity: "error",
        category: "content",
        message: "a",
        pointsDeducted: 80,
      },
      {
        code: "B",
        severity: "error",
        category: "content",
        message: "b",
        pointsDeducted: 80,
      },
    ];
    expect(scoreFromFindings([])).toBe(100);
    expect(scoreFromFindings(heavy)).toBe(0);
  });
});
