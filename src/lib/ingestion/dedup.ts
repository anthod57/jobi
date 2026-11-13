import { createHash } from "node:crypto";

/** Normalizes text for deduplication: NFD without diacritics, lowercase, punctuation as spaces, collapsed & trimmed. */
export function normalizeDedupText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Computes a 64-char lowercase hex SHA-256 deduplication key from normalized title, company, and location. */
export function computeDedupKey(input: {
  title: string;
  company: string;
  locationLabel: string;
}): string {
  const composite = [
    normalizeDedupText(input.title),
    normalizeDedupText(input.company),
    normalizeDedupText(input.locationLabel),
  ].join("|");

  return createHash("sha256").update(composite, "utf8").digest("hex");
}
