import type { AtsFinding, AtsRule } from "../types";
import {
  actionVerbCount,
  hasExperienceSection,
  hasSectionKeyword,
} from "../text-helpers";

function finding(partial: Omit<AtsFinding, "category">): AtsFinding {
  return { ...partial, category: "content" };
}

export const contentRules: AtsRule[] = [
  (text: string) => {
    if (text.length < 450) {
      return [
        finding({
          code: "TEXT_TOO_SHORT",
          severity: "error",
          message: "Le texte extrait du CV est trop court pour une analyse fiable.",
          pointsDeducted: 20,
        }),
      ];
    }
    return [];
  },
  (text: string) => {
    if (text.length > 18000) {
      return [
        finding({
          code: "TEXT_TOO_LONG",
          severity: "warning",
          message: "Le CV est très long ; les ATS peuvent tronquer le contenu.",
          pointsDeducted: 10,
        }),
      ];
    }
    return [];
  },
  (text: string) => {
    if (text.length === 0) return [];
    const replacementCount = (text.match(/\uFFFD/g) ?? []).length;
    if (replacementCount / text.length > 0.02) {
      return [
        finding({
          code: "LOW_EXTRACTION_QUALITY",
          severity: "error",
          message:
            "La qualité d'extraction du texte est faible (caractères illisibles).",
          pointsDeducted: 15,
        }),
      ];
    }
    return [];
  },
  (text: string) => {
    const opening = text.slice(0, 400);
    if (opening.length > 0 && !hasSectionKeyword(opening)) {
      return [
        finding({
          code: "GENERIC_OPENING_ONLY",
          severity: "warning",
          message:
            "Le début du CV ne contient pas de section identifiable (expérience, formation, etc.).",
          pointsDeducted: 5,
        }),
      ];
    }
    return [];
  },
  (text: string) => {
    if (!hasExperienceSection(text)) return [];
    if (actionVerbCount(text) < 2) {
      return [
        finding({
          code: "MISSING_ACTION_VERBS",
          severity: "info",
          message:
            "Peu de verbes d'action repérés dans les descriptions d'expérience.",
          pointsDeducted: 0,
        }),
      ];
    }
    return [];
  },
];
