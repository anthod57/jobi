import mammoth from "mammoth";

export const CV_MAX_BYTES = 5 * 1024 * 1024;

export const CV_ERRORS = {
  tooLarge: "Fichier trop volumineux (max 5 Mo).",
  unsupported: "Format non supporté (PDF ou DOCX uniquement).",
  extractFailed: "Impossible d'extraire le texte du CV.",
} as const;

const PDF_MIME = "application/pdf";
const PDF_ALT_MIMES = new Set([PDF_MIME, "application/x-pdf"]);
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function isPdfMagic(buffer: Buffer): boolean {
  return buffer.subarray(0, 32).toString("ascii").trimStart().startsWith("%PDF-");
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
    if (mime && !PDF_ALT_MIMES.has(mime)) return null;
    return "pdf";
  }
  if (isDocxMagic(buffer)) {
    if (mime && mime !== DOCX_MIME) return null;
    return "docx";
  }
  return null;
}

export interface CvLayoutMeta {
  isMultiColumn: boolean;
  pageCount: number;
}

export type CvParseSuccess = {
  ok: true;
  text: string;
  mimeType: string;
  layout: CvLayoutMeta;
};

export type CvParseFailure = {
  ok: false;
  error: string;
};

export type CvParseResult = CvParseSuccess | CvParseFailure;

/** Strips directory paths and control characters, capping length to DB varchar(255). */
export function sanitizeUploadFilename(rawName: string): string {
  const base = rawName.split(/[/\\]/).pop() ?? "";
  const cleaned = base.replace(/[\x00-\x1f\x7f]/g, "").trim();
  if (!cleaned) return "cv";
  return cleaned.length > 255 ? cleaned.slice(-255) : cleaned;
}

function cleanFragmentText(raw: string): string {
  return raw.replace(/[\uE000-\uF8FF]/g, "").replace(/\u00a0/g, " ");
}

function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/[\uE000-\uF8FF]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

type PdfFragment = {
  text: string;
  x: number;
  y: number;
  width: number;
};

type PdfLine = {
  y: number;
  minX: number;
  maxX: number;
  text: string;
  fragments: PdfFragment[];
};

function groupFragmentsIntoLines(fragments: PdfFragment[]): PdfLine[] {
  const sorted = [...fragments].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: PdfLine[] = [];
  const Y_TOLERANCE = 3;

  for (const frag of sorted) {
    const existing = lines.find((l) => Math.abs(l.y - frag.y) <= Y_TOLERANCE);
    if (existing) {
      existing.fragments.push(frag);
    } else {
      lines.push({
        y: frag.y,
        minX: frag.x,
        maxX: frag.x + frag.width,
        text: "",
        fragments: [frag],
      });
    }
  }

  for (const line of lines) {
    line.fragments.sort((a, b) => a.x - b.x);
    let minX = Infinity;
    let maxX = -Infinity;
    const parts: string[] = [];
    let prevEnd = -Infinity;

    for (const frag of line.fragments) {
      const cleaned = cleanFragmentText(frag.text);
      if (!cleaned.trim()) continue;
      if (prevEnd !== -Infinity && frag.x - prevEnd > 2 && !parts[parts.length - 1]?.endsWith(" ") && !cleaned.startsWith(" ")) {
        parts.push(" ");
      }
      parts.push(cleaned);
      minX = Math.min(minX, frag.x);
      maxX = Math.max(maxX, frag.x + frag.width);
      prevEnd = frag.x + frag.width;
    }

    line.minX = minX === Infinity ? 0 : minX;
    line.maxX = maxX === -Infinity ? 0 : maxX;
    line.text = parts.join("").replace(/[ \t]{2,}/g, " ").trim();
  }

  return lines.filter((l) => l.text.length > 0);
}

function findVerticalGutter(
  fragments: PdfFragment[],
  pageWidth: number,
): number | null {
  if (fragments.length < 4 || pageWidth <= 0) return null;
  const startRatio = 0.28;
  const endRatio = 0.52;
  const step = 0.02;
  let bestGutter: number | null = null;
  let bestBalance = 0;

  for (let r = startRatio; r <= endRatio + 1e-6; r += step) {
    const gx = pageWidth * r;
    const crossing = fragments.filter(
      (f) => f.x < gx - 2 && f.x + f.width > gx + 2,
    );
    if (crossing.length > 0) continue;

    const leftCount = fragments.filter((f) => f.x + f.width <= gx + 2).length;
    const rightCount = fragments.filter((f) => f.x >= gx - 2).length;
    if (leftCount >= 3 && rightCount >= 3) {
      const balance = Math.min(leftCount, rightCount);
      if (balance > bestBalance) {
        bestBalance = balance;
        bestGutter = gx;
      }
    }
  }

  return bestGutter;
}

function extractPageLayoutAware(
  fragments: PdfFragment[],
  pageWidth: number,
): { text: string; isMultiColumn: boolean } {
  const allLines = groupFragmentsIntoLines(fragments);
  if (allLines.length === 0) return { text: "", isMultiColumn: false };

  const zoneLeft = pageWidth * 0.28;
  const zoneRight = pageWidth * 0.52;

  // Detect contiguous top banner lines that span across [28%, 52%] of page width.
  let bannerCount = 0;
  for (const line of allLines) {
    if (line.minX < zoneLeft && line.maxX > zoneRight) {
      bannerCount += 1;
    } else {
      break;
    }
  }

  const bannerLines = allLines.slice(0, bannerCount);
  const bodyLines = allLines.slice(bannerCount);
  const bodyFragments = bodyLines.flatMap((l) => l.fragments);
  const gutterX = findVerticalGutter(bodyFragments, pageWidth);

  if (gutterX === null) {
    const text = allLines.map((l) => l.text).join("\n");
    return { text, isMultiColumn: false };
  }

  const leftFrags = bodyFragments.filter((f) => f.x + f.width <= gutterX + 2);
  const rightFrags = bodyFragments.filter((f) => f.x >= gutterX - 2);
  const leftLines = groupFragmentsIntoLines(leftFrags);
  const rightLines = groupFragmentsIntoLines(rightFrags);

  const sections = [
    bannerLines.map((l) => l.text).join("\n"),
    leftLines.map((l) => l.text).join("\n"),
    rightLines.map((l) => l.text).join("\n"),
  ].filter(Boolean);

  return { text: sections.join("\n\n"), isMultiColumn: true };
}

async function extractPdfLayoutAware(
  buffer: Buffer,
): Promise<{ text: string; layout: CvLayoutMeta }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    verbosity: 0,
  });
  const doc = await loadingTask.promise;

  try {
    const pageTexts: string[] = [];
    let anyMultiColumn = false;

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();

      const fragments: PdfFragment[] = [];
      for (const item of content.items) {
        if (!("str" in item) || !item.str) continue;
        const cleaned = cleanFragmentText(item.str);
        if (!cleaned.trim()) continue;
        const x = item.transform[4] ?? 0;
        const y = item.transform[5] ?? 0;
        const width = typeof item.width === "number" ? item.width : 0;
        fragments.push({ text: cleaned, x, y, width });
      }

      const pageResult = extractPageLayoutAware(fragments, viewport.width);
      if (pageResult.isMultiColumn) anyMultiColumn = true;
      if (pageResult.text) pageTexts.push(pageResult.text);
    }

    return {
      text: normalizeExtractedText(pageTexts.join("\n\n")),
      layout: {
        isMultiColumn: anyMultiColumn,
        pageCount: doc.numPages,
      },
    };
  } finally {
    await doc.destroy().catch(() => undefined);
  }
}

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
      const { text, layout } = await extractPdfLayoutAware(buffer);
      if (!text) {
        return { ok: false, error: CV_ERRORS.extractFailed };
      }
      return { ok: true, text, mimeType: PDF_MIME, layout };
    }

    const docx = await mammoth.extractRawText({ buffer });
    const text = normalizeExtractedText(docx.value ?? "");
    if (!text) {
      return { ok: false, error: CV_ERRORS.extractFailed };
    }
    return {
      ok: true,
      text,
      mimeType: DOCX_MIME,
      layout: { isMultiColumn: false, pageCount: 1 },
    };
  } catch (err) {
    console.error("[cv-parse] failed to extract CV text:", err);
    return { ok: false, error: CV_ERRORS.extractFailed };
  }
}
