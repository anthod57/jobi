import { describe, expect, it } from "vitest";

import { scoreBand } from "./score-band";

describe("scoreBand", () => {
  it.each([
    [0, "Insuffisant", "failure"],
    [49, "Insuffisant", "failure"],
    [50, "Moyen", "warning"],
    [74, "Moyen", "warning"],
    [75, "Bon", "success"],
    [89, "Bon", "success"],
    [90, "Excellent", "primary"],
    [100, "Excellent", "primary"],
  ] as const)("score %i → %s (%s)", (score, label, color) => {
    expect(scoreBand(score)).toEqual({ label, color });
  });
});
