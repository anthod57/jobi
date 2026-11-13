import { describe, expect, it } from "vitest";

import type { AtsFinding } from "./types";
import {
  ATS_SEVERITY_ORDER,
  compareFindingsBySeverity,
  severityToAlertVariant,
} from "./ats-findings-order";

const finding = (
  severity: AtsFinding["severity"],
  code: string,
): AtsFinding => ({
  code,
  severity,
  category: "content",
  message: code,
  pointsDeducted: 1,
});

describe("compareFindingsBySeverity", () => {
  it("orders error before warning before info", () => {
    const sorted = [
      finding("info", "i"),
      finding("error", "e"),
      finding("warning", "w"),
    ].sort(compareFindingsBySeverity);
    expect(sorted.map((f) => f.severity)).toEqual(ATS_SEVERITY_ORDER);
  });
});

describe("severityToAlertVariant", () => {
  it("maps ATS severity to Alert variant", () => {
    expect(severityToAlertVariant("error")).toBe("failure");
    expect(severityToAlertVariant("warning")).toBe("warning");
    expect(severityToAlertVariant("info")).toBe("info");
  });
});
