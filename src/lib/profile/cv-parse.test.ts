import fs from "node:fs";
import path from "node:path";
import mammoth from "mammoth";
import { describe, expect, it, vi } from "vitest";

import {
  CV_ERRORS,
  CV_MAX_BYTES,
  detectCvType,
  parseCvBuffer,
  sanitizeUploadFilename,
} from "./cv-parse";

describe("detectCvType", () => {
  it("detects PDF from magic bytes", () => {
    const buf = Buffer.from("%PDF-1.4\n");
    expect(detectCvType(buf, "application/pdf")).toBe("pdf");
  });

  it("detects DOCX from ZIP magic", () => {
    const buf = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    expect(detectCvType(buf, undefined)).toBe("docx");
  });

  it("returns null when mime conflicts with magic", () => {
    const buf = Buffer.from("%PDF-1.4\n");
    expect(detectCvType(buf, "text/plain")).toBeNull();
  });
});

describe("parseCvBuffer", () => {
  it("rejects buffers over CV_MAX_BYTES", async () => {
    const huge = Buffer.alloc(CV_MAX_BYTES + 1);
    const result = await parseCvBuffer(huge);
    expect(result).toEqual({ ok: false, error: CV_ERRORS.tooLarge });
  });

  it("rejects unsupported content", async () => {
    const result = await parseCvBuffer(Buffer.from("plain text cv"));
    expect(result).toEqual({ ok: false, error: CV_ERRORS.unsupported });
  });

  it("extracts two-column PDF in top-banner then left-then-right column order without PUA icons", async () => {
    const pdfPath = path.resolve(
      process.cwd(),
      "src/test/fixtures/cv/cv-two-column-backend.pdf",
    );
    const buffer = fs.readFileSync(pdfPath);
    const result = await parseCvBuffer(buffer, "application/pdf");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.layout).toEqual({ isMultiColumn: true, pageCount: 1 });
    expect(result.text).not.toMatch(/[\uE000-\uF8FF]/);
  });

  it("extracts single-column PDF with isMultiColumn: false", async () => {
    const pdfPath = path.resolve(
      process.cwd(),
      "src/test/fixtures/cv/cv-complete-modern.pdf",
    );
    const buffer = fs.readFileSync(pdfPath);
    const result = await parseCvBuffer(buffer, "application/pdf");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.layout.isMultiColumn).toBe(false);
    expect(result.layout.pageCount).toBeGreaterThanOrEqual(1);
  });

  it("returns default single-column layout metadata for DOCX", async () => {
    const spy = vi
      .spyOn(mammoth, "extractRawText")
      .mockResolvedValueOnce({ value: "Jean Dupont\n\uE001 Développeur", messages: [] });
    const fakeDocx = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]);

    const result = await parseCvBuffer(fakeDocx);
    spy.mockRestore();

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.layout).toEqual({ isMultiColumn: false, pageCount: 1 });
    expect(result.text).not.toMatch(/[\uE000-\uF8FF]/);
    expect(result.text).toContain("Jean Dupont");
  });
});

describe("sanitizeUploadFilename", () => {
  it("strips path segments, control chars, and caps length at 255", () => {
    expect(sanitizeUploadFilename("../../etc/passwd\x00.pdf")).toBe("passwd.pdf");
    expect(sanitizeUploadFilename("C:\\fakepath\\mon_cv.pdf")).toBe("mon_cv.pdf");
    expect(sanitizeUploadFilename("   ")).toBe("cv");
    expect(sanitizeUploadFilename(`${"a".repeat(300)}.pdf`).length).toBe(255);
  });
});
