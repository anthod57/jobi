import { describe, expect, it } from "vitest";

import {
  CV_ERRORS,
  CV_MAX_BYTES,
  detectCvType,
  parseCvBuffer,
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
});
