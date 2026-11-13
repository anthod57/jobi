import type { AtsContext, AtsFinding, AtsRule } from "../types";
import {
  findEmailLikeInvalidTld,
  findEmails,
  hasPhonePattern,
} from "../text-helpers";

function finding(partial: Omit<AtsFinding, "category">): AtsFinding {
  return { ...partial, category: "contact" };
}

export const contactRules: AtsRule[] = [
  (text: string, ctx: AtsContext) => {
    const emailsInCv = findEmails(text);
    if (emailsInCv.length === 0 && !ctx.profileEmail.trim()) {
      return [
        finding({
          code: "MISSING_EMAIL",
          severity: "error",
          message:
            "Aucune adresse e-mail détectée dans le CV ni renseignée dans le profil.",
          pointsDeducted: 15,
        }),
      ];
    }
    return [];
  },
  (text: string) => {
    if (findEmailLikeInvalidTld(text)) {
      return [
        finding({
          code: "WEAK_EMAIL_IN_CV",
          severity: "warning",
          message:
            "Une adresse e-mail dans le CV semble invalide (domaine incomplet).",
          pointsDeducted: 5,
        }),
      ];
    }
    return [];
  },
  (text: string, ctx: AtsContext) => {
    if (!hasPhonePattern(text) && !ctx.profilePhone.trim()) {
      return [
        finding({
          code: "MISSING_PHONE",
          severity: "warning",
          message:
            "Aucun numéro de téléphone détecté dans le CV ni renseigné dans le profil.",
          pointsDeducted: 8,
        }),
      ];
    }
    return [];
  },
  (text: string) => {
    const emails = findEmails(text);
    if (emails.length >= 2) {
      return [
        finding({
          code: "DUPLICATE_CONTACT",
          severity: "warning",
          message: "Plusieurs adresses e-mail apparaissent dans le CV.",
          pointsDeducted: 4,
        }),
      ];
    }
    return [];
  },
];
