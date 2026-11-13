import type { AtsContext, AtsFinding, AtsRule } from "../types";
import {
  hasEducationSection,
  hasExperienceSection,
  hasSkillsSection,
  skillInText,
} from "../text-helpers";

function finding(partial: Omit<AtsFinding, "category">): AtsFinding {
  return { ...partial, category: "structure" };
}

export const structureRules: AtsRule[] = [
  (text: string) => {
    if (!hasExperienceSection(text)) {
      return [
        finding({
          code: "MISSING_EXPERIENCE_SECTION",
          severity: "error",
          message:
            "Aucune section expérience / emploi clairement identifiée dans le CV.",
          pointsDeducted: 12,
        }),
      ];
    }
    return [];
  },
  (text: string) => {
    if (!hasEducationSection(text)) {
      return [
        finding({
          code: "MISSING_EDUCATION_SECTION",
          severity: "warning",
          message: "Aucune section formation / diplôme identifiée dans le CV.",
          pointsDeducted: 8,
        }),
      ];
    }
    return [];
  },
  (text: string, ctx: AtsContext) => {
    if (hasSkillsSection(text)) return [];
    const matched = ctx.profileSkills.filter((s) => skillInText(s, text)).length;
    if (matched < 3) {
      return [
        finding({
          code: "MISSING_SKILLS_SECTION",
          severity: "warning",
          message:
            "Pas de section compétences et peu de compétences du profil retrouvées dans le CV.",
          pointsDeducted: 8,
        }),
      ];
    }
    return [];
  },
];
