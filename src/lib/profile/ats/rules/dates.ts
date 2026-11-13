import type { AtsFinding, AtsRule } from "../types";
import {
  dateFormatFamiliesPresent,
  hasAnyDatePattern,
  parseLatestExperienceEndYear,
} from "../text-helpers";

function finding(partial: Omit<AtsFinding, "category">): AtsFinding {
  return { ...partial, category: "dates" };
}

export const dateRules: AtsRule[] = [
  (text: string) => {
    if (!hasAnyDatePattern(text)) {
      return [
        finding({
          code: "NO_DATES_DETECTED",
          severity: "error",
          message: "Aucune date repérée dans le CV (expériences, formations).",
          pointsDeducted: 12,
        }),
      ];
    }
    return [];
  },
  (text: string) => {
    if (dateFormatFamiliesPresent(text).size >= 3) {
      return [
        finding({
          code: "INCONSISTENT_DATE_FORMATS",
          severity: "warning",
          message: "Plusieurs formats de dates coexistent dans le CV.",
          pointsDeducted: 5,
        }),
      ];
    }
    return [];
  },
  (text: string) => {
    const latestYear = parseLatestExperienceEndYear(text);
    if (latestYear === null) return [];
    const currentYear = new Date().getFullYear();
    if (currentYear - latestYear > 8) {
      return [
        finding({
          code: "STALE_EXPERIENCE_END",
          severity: "warning",
          message:
            "La dernière date d'expérience semble ancienne (plus de 8 ans).",
          pointsDeducted: 6,
        }),
      ];
    }
    return [];
  },
];
