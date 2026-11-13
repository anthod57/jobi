import { describe, expect, it } from "vitest";

import {
  findEmails,
  hasAnyDatePattern,
  normalizeForMatch,
  skillInText,
  skillsCoverageRatio,
} from "./text-helpers";

describe("normalizeForMatch", () => {
  it("folds French accents for comparison", () => {
    expect(normalizeForMatch("Développé")).toBe("developpe");
  });
});

describe("findEmails", () => {
  it("extracts valid email addresses", () => {
    expect(findEmails("contact: alice@example.com")).toEqual([
      "alice@example.com",
    ]);
  });
});

describe("skillInText", () => {
  it("matches skills regardless of accents and case", () => {
    expect(skillInText("TypeScript", "stack: typescript, react")).toBe(true);
    expect(skillInText("React", "utilise Réact")).toBe(true);
  });
});

describe("skillsCoverageRatio", () => {
  it("returns null when profile has no skills", () => {
    expect(skillsCoverageRatio([], "cv text")).toBeNull();
  });

  it("returns matched fraction", () => {
    expect(
      skillsCoverageRatio(
        ["TypeScript", "Rust", "Go"],
        "stack: TypeScript and Go",
      ),
    ).toBe(2 / 3);
  });
});

describe("hasAnyDatePattern", () => {
  it("detects ISO and French month-year patterns", () => {
    expect(hasAnyDatePattern("2020-01-15")).toBe(true);
    expect(hasAnyDatePattern("janvier 2021")).toBe(true);
    expect(hasAnyDatePattern("no dates here")).toBe(false);
  });
});
