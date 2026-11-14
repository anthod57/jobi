import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseCvBuffer } from "./cv-parse";
import { extractCvSections } from "./cv-sections";

describe("extractCvSections", () => {
  it("splits contact, experiences, skills, soft-skills, education, and other lines", () => {
    const text = [
      "Jean Valjean",
      "jean.valjean@example.com | +33 6 11 22 33 44 | https://linkedin.com/in/jvaljean",
      "EXPÉRIENCES PROFESSIONNELLES",
      "Lead Dev — Acme (2022 - 2025)",
      "- Architecture TypeScript et Next.js",
      "COMPÉTENCES TECHNIQUES",
      "TypeScript, React, PostgreSQL, Docker",
      "SOFT-SKILLS",
      "Leadership, Esprit d'équipe, Communication",
      "FORMATION",
      "Master Informatique — Paris-Saclay (2020)",
      "LANGUES",
      "Français (natif), Anglais (C1)",
    ].join("\n");

    const sections = extractCvSections(text);

    expect(sections.contact).toContain("jean.valjean@example.com");
    expect(sections.contact.some((c) => c.includes("6 11 22 33 44"))).toBe(true);
    expect(sections.contact.some((c) => c.includes("linkedin.com/in/jvaljean"))).toBe(true);
    expect(sections.experiences).toEqual([
      "Lead Dev — Acme (2022 - 2025)",
      "- Architecture TypeScript et Next.js",
    ]);
    expect(sections.skills).toEqual(["TypeScript", "React", "PostgreSQL", "Docker"]);
    expect(sections.softSkills).toEqual([
      "Leadership",
      "Esprit d'équipe",
      "Communication",
    ]);
    expect(sections.education).toEqual([
      "Master Informatique — Paris-Saclay (2020)",
    ]);
    expect(sections.other).toContain("Jean Valjean");
    expect(sections.other).toContain("Français (natif), Anglais (C1)");
  });

  it("extracts sections from the complete modern PDF fixture", async () => {
    const buf = readFileSync(
      join(process.cwd(), "src", "test", "fixtures", "cv", "cv-complete-modern.pdf"),
    );
    const parsed = await parseCvBuffer(buf, "application/pdf");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const sections = extractCvSections(parsed.text);
    expect(sections.contact).toContain("alice.martin@example.com");
    expect(sections.experiences.length).toBeGreaterThanOrEqual(3);
    expect(sections.skills).toContain("TypeScript");
    expect(sections.skills).toContain("PostgreSQL");
    expect(sections.education[0]).toContain("Master Informatique");
  });

  it("returns empty arrays for empty text", () => {
    expect(extractCvSections("   ")).toEqual({
      contact: [],
      experiences: [],
      skills: [],
      softSkills: [],
      education: [],
      other: [],
    });
  });
});
