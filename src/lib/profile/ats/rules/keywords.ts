import type { AtsFinding, AtsRule } from "../types";
import { skillsCoverageRatio } from "../text-helpers";

function finding(partial: Omit<AtsFinding, "category">): AtsFinding {
  return { ...partial, category: "keywords" };
}

export const keywordRules: AtsRule[] = [
  (text: string, ctx) => {
    const ratio = skillsCoverageRatio(ctx.profileSkills, text);
    if (ratio === null) return [];
    if (ratio < 0.4) {
      return [
        finding({
          code: "SKILLS_COVERAGE_LOW",
          severity: "error",
          message:
            "Moins de 40 % des compétences du profil apparaissent dans le CV.",
          pointsDeducted: 15,
        }),
      ];
    }
    if (ratio < 0.7) {
      return [
        finding({
          code: "SKILLS_COVERAGE_PARTIAL",
          severity: "warning",
          message:
            "Une partie des compétences du profil est absente du CV (couverture partielle).",
          pointsDeducted: 7,
        }),
      ];
    }
    return [
      finding({
        code: "SKILLS_COVERAGE_GOOD",
        severity: "info",
        message: "Bonne couverture des compétences du profil dans le CV.",
        pointsDeducted: 0,
      }),
    ];
  },
];
