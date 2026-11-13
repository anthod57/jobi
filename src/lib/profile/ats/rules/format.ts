import type { AtsFinding, AtsRule } from "../types";
import { linesOf } from "../text-helpers";

function finding(partial: Omit<AtsFinding, "category">): AtsFinding {
  return { ...partial, category: "format" };
}

const BULLET_START = /^[\s]*(?:[•●▪\-–*]|\d+[.)])\s*/;

export const formatRules: AtsRule[] = [
  (text: string) => {
    if (text.length === 0) return [];
    const nonAlnum = (text.match(/[^a-zA-Z0-9\s]/g) ?? []).length;
    if (nonAlnum / text.length > 0.18) {
      return [
        finding({
          code: "EXCESSIVE_SPECIAL_CHARS",
          severity: "warning",
          message: "Le CV contient beaucoup de caractères spéciaux.",
          pointsDeducted: 6,
        }),
      ];
    }
    return [];
  },
  (text: string) => {
    const lines = linesOf(text).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];
    const shortLines = lines.filter((l) => l.trim().length < 12).length;
    if (shortLines / lines.length > 0.35) {
      return [
        finding({
          code: "EXCESSIVE_SHORT_LINES",
          severity: "warning",
          message: "Beaucoup de lignes très courtes (colonnes ou listes denses).",
          pointsDeducted: 5,
        }),
      ];
    }
    return [];
  },
  (text: string) => {
    const lines = linesOf(text).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];
    const capsLines = lines.filter(
      (l) => l === l.toUpperCase() && /[A-Z]/.test(l),
    ).length;
    if (capsLines / lines.length > 0.12) {
      return [
        finding({
          code: "EXCESSIVE_ALL_CAPS",
          severity: "warning",
          message: "Trop de lignes entièrement en majuscules.",
          pointsDeducted: 5,
        }),
      ];
    }
    return [];
  },
  (text: string) => {
    const lines = linesOf(text);
    if (lines.length === 0) return [];
    const columnLike = lines.filter(
      (l) => l.includes("\t") || /\s{4,}/.test(l),
    ).length;
    if (columnLike / lines.length > 0.08) {
      return [
        finding({
          code: "SUSPECTED_COLUMNS",
          severity: "warning",
          message:
            "Mise en page en colonnes ou tableaux détectée (peu lisible pour certains ATS).",
          pointsDeducted: 5,
        }),
      ];
    }
    return [];
  },
  (text: string) => {
    const lines = linesOf(text).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];
    const bullets = lines.filter((l) => BULLET_START.test(l)).length;
    if (bullets / lines.length > 0.45) {
      return [
        finding({
          code: "BULLET_OVERLOAD",
          severity: "info",
          message: "Le CV est très structuré en listes à puces.",
          pointsDeducted: 0,
        }),
      ];
    }
    return [];
  },
];
