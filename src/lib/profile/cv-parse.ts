import mammoth from "mammoth";

export const CV_MAX_BYTES = 5 * 1024 * 1024;

export const CV_ERRORS = {
  tooLarge: "Fichier trop volumineux (max 5 Mo).",
  unsupported: "Format non supporté (PDF ou DOCX uniquement).",
  extractFailed: "Impossible d'extraire le texte du CV.",
} as const;

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function isPdfMagic(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

function isDocxMagic(buffer: Buffer): boolean {
  return buffer[0] === 0x50 && buffer[1] === 0x4b;
}

export type DetectedCvType = "pdf" | "docx";

export function detectCvType(
  buffer: Buffer,
  declaredMime: string | undefined,
): DetectedCvType | null {
  const mime = declaredMime?.toLowerCase() ?? "";
  if (isPdfMagic(buffer)) {
    if (mime && mime !== PDF_MIME) return null;
    return "pdf";
  }
  if (isDocxMagic(buffer)) {
    if (mime && mime !== DOCX_MIME) return null;
    return "docx";
  }
  return null;
}

export type CvParseSuccess = {
  ok: true;
  text: string;
  mimeType: string;
};

export type CvParseFailure = {
  ok: false;
  error: string;
};

export type CvParseResult = CvParseSuccess | CvParseFailure;

export async function parseCvBuffer(
  buffer: Buffer,
  declaredMime?: string,
): Promise<CvParseResult> {
  if (buffer.byteLength > CV_MAX_BYTES) {
    return { ok: false, error: CV_ERRORS.tooLarge };
  }

  const kind = detectCvType(buffer, declaredMime);
  if (!kind) {
    return { ok: false, error: CV_ERRORS.unsupported };
  }

  try {
    if (kind === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      const text = parsed.text?.trim() ?? "";
      if (!text) {
        return { ok: false, error: CV_ERRORS.extractFailed };
      }
      return { ok: true, text, mimeType: PDF_MIME };
    }

    const docx = await mammoth.extractRawText({ buffer });
    const text = docx.value?.trim() ?? "";
    if (!text) {
      return { ok: false, error: CV_ERRORS.extractFailed };
    }
    return { ok: true, text, mimeType: DOCX_MIME };
  } catch {
    return { ok: false, error: CV_ERRORS.extractFailed };
  }
}
