import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { runAtsAnalysis } from "./ats/runAtsAnalysis";
import { detectCvType, parseCvBuffer } from "./cv-parse";

const FIXTURES_DIR = join(process.cwd(), "src", "test", "fixtures", "cv");

function loadFixture(name: string): Buffer {
  return readFileSync(join(FIXTURES_DIR, name));
}

const emptyCtx = {
  profileSkills: ["TypeScript", "React", "Next.js", "PostgreSQL", "Docker"],
  profileEmail: "",
  profilePhone: "",
};

describe("CV PDF fixtures parsing + ATS analysis", () => {
  it("accepts application/x-pdf mime type for PDF magic bytes", () => {
    const buf = loadFixture("cv-complete-modern.pdf");
    expect(detectCvType(buf, "application/x-pdf")).toBe("pdf");
  });

  it("parses complete modern CV without page-joiner artifacts and scores high", async () => {
    const buf = loadFixture("cv-complete-modern.pdf");
    const parsed = await parseCvBuffer(buf, "application/pdf");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.text).toContain("Alice Martin");
    expect(parsed.text).not.toContain("-- 1 of 1 --");

    const ats = runAtsAnalysis(parsed.text, emptyCtx);
    expect(ats.score).toBeGreaterThanOrEqual(75);
    expect(ats.findings.some((f) => f.code === "MISSING_EMAIL")).toBe(false);
    expect(ats.findings.some((f) => f.code === "MISSING_PHONE")).toBe(false);
    expect(ats.findings.some((f) => f.code === "NO_DATES_DETECTED")).toBe(false);
  });

  it("parses multi-page compressed colored CV without page-joiner artifacts and scores mid", async () => {
    const buf = loadFixture("cv-minimal-colored.pdf");
    const parsed = await parseCvBuffer(buf, "application/pdf");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.text).toContain("Bob Dupont");
    expect(parsed.text).toContain("Licence Professionnelle Web");
    expect(parsed.text).not.toContain("-- 1 of 2 --");
    expect(parsed.text).not.toContain("-- 2 of 2 --");

    const ats = runAtsAnalysis(parsed.text, emptyCtx);
    expect(ats.findings.some((f) => f.code === "MISSING_PHONE")).toBe(true);
    expect(ats.score).toBeLessThan(85);
  });

  it("parses sparse accent CV and flags missing contact, dates, and short text", async () => {
    const buf = loadFixture("cv-sparse-accent.pdf");
    const parsed = await parseCvBuffer(buf, "application/pdf");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.text).toContain("Profil Candidat");
    const ats = runAtsAnalysis(parsed.text, emptyCtx);
    const codes = ats.findings.map((f) => f.code);
    expect(codes).toContain("TEXT_TOO_SHORT");
    expect(codes).toContain("MISSING_EMAIL");
    expect(codes).toContain("MISSING_PHONE");
    expect(codes).toContain("NO_DATES_DETECTED");
    expect(ats.score).toBeLessThan(60);
  });
});
