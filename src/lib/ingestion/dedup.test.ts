import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { computeDedupKey, normalizeDedupText } from "./dedup";

describe("dedup", () => {
  it("normalizes diacritics, case, punctuation, and whitespace", () => {
    expect(normalizeDedupText("  Développeur Full-Stack — React/Next.js  ")).toBe(
      "developpeur full stack react next js",
    );
    expect(normalizeDedupText("Île-de-France,   75001 (Paris)")).toBe(
      "ile de france 75001 paris",
    );
    expect(normalizeDedupText("   ")).toBe("");
  });

  it("computes a deterministic 64-char lowercase hex SHA-256 over normalized fields", () => {
    const key = computeDedupKey({
      title: "Développeur TypeScript (H/F)",
      company: "ACME — France",
      locationLabel: "Lyon, 69002",
    });

    expect(key).toMatch(/^[0-9a-f]{64}$/);

    const expected = createHash("sha256")
      .update("developpeur typescript h f|acme france|lyon 69002", "utf8")
      .digest("hex");
    expect(key).toBe(expected);
  });

  it("produces identical keys across casing/accent/punctuation variants", () => {
    const a = computeDedupKey({
      title: "Ingénieur DevOps",
      company: "Société Générale",
      locationLabel: "Paris - La Défense",
    });
    const b = computeDedupKey({
      title: "  ingenieur   devops ",
      company: "societe generale!",
      locationLabel: "PARIS / La Defense",
    });

    expect(a).toBe(b);
  });

  it("produces distinct keys when any field differs", () => {
    const base = computeDedupKey({
      title: "Développeur Node.js",
      company: "Jobi",
      locationLabel: "Paris",
    });
    const otherCity = computeDedupKey({
      title: "Développeur Node.js",
      company: "Jobi",
      locationLabel: "Nantes",
    });

    expect(base).not.toBe(otherCity);
  });
});
