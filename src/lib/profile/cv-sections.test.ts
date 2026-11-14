import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

const { mockParseCvWithLlm } = vi.hoisted(() => ({
  mockParseCvWithLlm: vi.fn(),
}));

vi.mock("./cv-llm-parser", () => ({
  parseCvWithLlm: mockParseCvWithLlm,
}));

import { parseCvBuffer } from "./cv-parse";
import {
  extractCvSections,
  extractCvStructuredDeterministic,
  parseCvStructured,
  structuredCvSchema,
} from "./cv-sections";

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

describe("structuredCvSchema", () => {
  it("validates a conforming StructuredCv object", () => {
    const valid = {
      contact: {
        fullName: "Alice Martin",
        headline: "Développeuse Backend",
        location: "Paris",
        emails: ["alice@example.com"],
        phones: ["+33 6 12 34 56 78"],
        urls: ["github.com/alice"],
      },
      experiences: [
        {
          title: "Backend Engineer",
          company: "Acme",
          startDate: "2022",
          endDate: "Présent",
          highlights: ["Node.js", "PostgreSQL"],
        },
      ],
      education: [
        {
          degree: "Master Informatique",
          school: "Paris-Saclay",
          year: "2020",
        },
      ],
      skills: ["TypeScript", "PostgreSQL"],
      softSkills: ["Autonomie"],
      other: ["Français (natif)"],
    };
    expect(structuredCvSchema.safeParse(valid).success).toBe(true);
    expect(structuredCvSchema.safeParse({ contact: {} }).success).toBe(false);
  });
});

describe("extractCvStructuredDeterministic", () => {
  it("handles extended headers, subtitle filtering, strict separation, skill dedup, and URL normalization", () => {
    const text = [
      "Alice Martin",
      "Développeuse Full-Stack",
      "alice@example.com | +33 6 12 34 56 78 | https://www.linkedin.com/in/alice-martin/ | https://github.com/alicem/",
      "COMPÉTENCES TECHNIQUES",
      "Langages : TypeScript, Python, typescript",
      "Outils : Docker, PostgreSQL",
      "QUALITÉS PERSONNELLES",
      "Leadership, Communication",
      "EXPÉRIENCES PROFESSIONNELLES",
      "Backend Engineer — Acme (2022 - 2025)",
      "- API REST Node.js",
      "DIPLÔMES ET FORMATIONS",
      "Master Informatique — Paris-Saclay (2020)",
      "LANGUES",
      "Anglais (C1)",
      "CENTRES D'INTÉRÊT",
      "Escalade",
    ].join("\n");

    const structured = extractCvStructuredDeterministic(text);

    expect(structured.contact.emails).toEqual(["alice@example.com"]);
    expect(structured.contact.urls).toEqual([
      "linkedin.com/in/alice-martin",
      "github.com/alicem",
    ]);
    expect(structured.skills).toEqual([
      "TypeScript",
      "Python",
      "Docker",
      "PostgreSQL",
    ]);
    expect(structured.softSkills).toEqual(["Leadership", "Communication"]);
    expect(structured.other).toEqual(
      expect.arrayContaining(["Anglais (C1)", "Escalade"]),
    );
    expect(structured.skills).not.toContain("Anglais (C1)");
    expect(structured.skills).not.toContain("Escalade");
    expect(structured.experiences.length).toBeGreaterThanOrEqual(1);
    expect(structured.experiences[0].title).toContain("Backend Engineer");
    expect(structured.education.length).toBeGreaterThanOrEqual(1);
    expect(structured.education[0].degree).toContain("Master Informatique");
  });
});

describe("parseCvStructured", () => {
  it("uses LLM result when available and normalizes/deduplicates it", async () => {
    mockParseCvWithLlm.mockResolvedValueOnce({
      contact: {
        fullName: "Bob",
        emails: ["bob@example.com"],
        phones: [],
        urls: ["https://www.github.com/bob/"],
      },
      experiences: [],
      education: [],
      skills: ["React", "react", "TypeScript"],
      softSkills: ["Rigueur"],
      other: [],
    });

    const out = await parseCvStructured("Bob\nbob@example.com");
    expect(out.mode).toBe("llm");
    expect(out.structured.skills).toEqual(["React", "TypeScript"]);
    expect(out.structured.contact.urls).toEqual(["github.com/bob"]);
  });

  it("falls back silently to deterministic mode when LLM returns null or throws", async () => {
    mockParseCvWithLlm.mockRejectedValueOnce(new Error("timeout"));

    const out = await parseCvStructured(
      "Bob\nbob@example.com\nCOMPÉTENCES\nTypeScript, Node.js",
    );
    expect(out.mode).toBe("deterministic");
    expect(out.structured.skills).toEqual(["TypeScript", "Node.js"]);
  });
});
