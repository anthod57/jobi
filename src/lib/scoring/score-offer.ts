import type {
  CriterionBreakdown,
  CriterionStatus,
  ScoreCriterionKey,
  ScoreResult,
} from "./types";

export type ContractType =
  | "cdi"
  | "cdd"
  | "alternance"
  | "freelance"
  | "interim"
  | "stage";

export type RemoteMode = "onsite" | "hybrid" | "remote" | "flexible";

export interface ScorableOffer {
  title: string;
  company: string;
  locationLabel: string;
  contractType: ContractType | null;
  remoteMode: RemoteMode | null;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
}

export interface ScorableProfile {
  headline: string | null;
  locationLabel: string;
  remotePreference: RemoteMode;
  minSalaryAnnualGross: number | null;
  contractTypes: ContractType[];
  skills: string[];
}

const WEIGHTS: Record<ScoreCriterionKey, number> = {
  skills: 40,
  title: 15,
  contract: 15,
  remote: 10,
  salary: 10,
  location: 10,
};

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  return normalized.match(/[a-z0-9]+/g) ?? [];
}

function hasTokenSequence(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0) return false;
  if (needle.length === 1) return haystack.includes(needle[0]);
  for (let i = 0; i <= haystack.length - needle.length; i += 1) {
    let allMatch = true;
    for (let j = 0; j < needle.length; j += 1) {
      if (haystack[i + j] !== needle[j]) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return true;
  }
  return false;
}

function statusFromScore(score: number): CriterionStatus {
  if (score === 100) return "matched";
  if (score === 0) return "mismatch";
  return "partial";
}

function neutral(key: ScoreCriterionKey, detail: string): CriterionBreakdown {
  return { key, weight: WEIGHTS[key], score: null, status: "neutral", detail };
}

function isProfileEmpty(profile: ScorableProfile): boolean {
  return (
    profile.skills.length === 0 &&
    !(profile.headline ?? "").trim() &&
    profile.contractTypes.length === 0 &&
    profile.minSalaryAnnualGross === null &&
    !profile.locationLabel.trim() &&
    profile.remotePreference === "flexible"
  );
}

function evaluateSkills(
  offer: ScorableOffer,
  profile: ScorableProfile,
): {
  breakdown: CriterionBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
} {
  if (profile.skills.length === 0) {
    return {
      breakdown: neutral("skills", "Aucune compétence renseignée sur le profil"),
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const offerTokens = tokenize(`${offer.title} ${offer.description}`);
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of profile.skills) {
    const skillTokens = tokenize(skill);
    if (hasTokenSequence(offerTokens, skillTokens)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const score = Math.round((matchedSkills.length / profile.skills.length) * 100);
  return {
    breakdown: {
      key: "skills",
      weight: WEIGHTS.skills,
      score,
      status: statusFromScore(score),
      detail: `${matchedSkills.length}/${profile.skills.length} compétences trouvées`,
    },
    matchedSkills,
    missingSkills,
  };
}

function evaluateTitle(
  offer: ScorableOffer,
  profile: ScorableProfile,
): CriterionBreakdown {
  const headline = (profile.headline ?? "").trim();
  if (!headline || !offer.title.trim()) {
    return neutral("title", "Titre cible ou titre de l'offre absent");
  }

  const headlineTokens = Array.from(new Set(tokenize(headline)));
  if (headlineTokens.length === 0) {
    return neutral("title", "Titre cible non exploitable");
  }

  const offerTitleTokens = new Set(tokenize(offer.title));
  const matchedCount = headlineTokens.filter((t) =>
    offerTitleTokens.has(t),
  ).length;
  const score = Math.round((matchedCount / headlineTokens.length) * 100);

  return {
    key: "title",
    weight: WEIGHTS.title,
    score,
    status: statusFromScore(score),
    detail: `${matchedCount}/${headlineTokens.length} mots-clés du titre présents`,
  };
}

function evaluateContract(
  offer: ScorableOffer,
  profile: ScorableProfile,
): CriterionBreakdown {
  if (profile.contractTypes.length === 0 || offer.contractType === null) {
    return neutral("contract", "Type de contrat non renseigné");
  }

  const matched = profile.contractTypes.includes(offer.contractType);
  const score = matched ? 100 : 0;
  return {
    key: "contract",
    weight: WEIGHTS.contract,
    score,
    status: statusFromScore(score),
    detail: matched
      ? `Contrat ${offer.contractType} compatible`
      : `Contrat ${offer.contractType} hors préférences`,
  };
}

function evaluateRemote(
  offer: ScorableOffer,
  profile: ScorableProfile,
): CriterionBreakdown {
  if (offer.remoteMode === null || profile.remotePreference === "flexible") {
    return neutral("remote", "Préférence télétravail flexible ou non précisée");
  }

  if (
    offer.remoteMode === "flexible" ||
    offer.remoteMode === profile.remotePreference
  ) {
    return {
      key: "remote",
      weight: WEIGHTS.remote,
      score: 100,
      status: "matched",
      detail: `Mode ${offer.remoteMode} compatible`,
    };
  }

  if (offer.remoteMode === "hybrid" || profile.remotePreference === "hybrid") {
    return {
      key: "remote",
      weight: WEIGHTS.remote,
      score: 50,
      status: "partial",
      detail: `Mode ${offer.remoteMode} partiellement compatible avec ${profile.remotePreference}`,
    };
  }

  return {
    key: "remote",
    weight: WEIGHTS.remote,
    score: 0,
    status: "mismatch",
    detail: `Mode ${offer.remoteMode} incompatible avec ${profile.remotePreference}`,
  };
}

function evaluateSalary(
  offer: ScorableOffer,
  profile: ScorableProfile,
): CriterionBreakdown {
  const minWanted = profile.minSalaryAnnualGross;
  if (
    minWanted === null ||
    (offer.salaryMin === null && offer.salaryMax === null)
  ) {
    return neutral("salary", "Salaire non renseigné");
  }

  const offerBottom = offer.salaryMin ?? offer.salaryMax!;
  const offerTop = offer.salaryMax ?? offer.salaryMin!;

  let score = 0;
  if (offerBottom >= minWanted) {
    score = 100;
  } else if (offerTop >= minWanted) {
    score = 70;
  } else if (offerTop >= minWanted * 0.85) {
    score = 40;
  }

  return {
    key: "salary",
    weight: WEIGHTS.salary,
    score,
    status: statusFromScore(score),
    detail: `Fourchette offre ${offerBottom}–${offerTop} € vs min ${minWanted} €`,
  };
}

function evaluateLocation(
  offer: ScorableOffer,
  profile: ScorableProfile,
): CriterionBreakdown {
  const profileLoc = profile.locationLabel.trim();
  const offerLoc = offer.locationLabel.trim();
  if (!profileLoc || !offerLoc) {
    return neutral("location", "Localisation non renseignée");
  }

  if (offer.remoteMode === "remote") {
    return {
      key: "location",
      weight: WEIGHTS.location,
      score: 100,
      status: "matched",
      detail: "Offre en télétravail complet",
    };
  }

  const profileTokens = tokenize(profileLoc);
  const offerTokens = new Set(tokenize(offerLoc));
  const matched = profileTokens.some((t) => offerTokens.has(t));
  const score = matched ? 100 : 0;

  return {
    key: "location",
    weight: WEIGHTS.location,
    score,
    status: statusFromScore(score),
    detail: matched
      ? `Localisation ${offerLoc} compatible`
      : `Localisation ${offerLoc} différente de ${profileLoc}`,
  };
}

export function scoreOffer(
  offer: ScorableOffer,
  profile: ScorableProfile,
): ScoreResult {
  if (isProfileEmpty(profile)) {
    return {
      score: null,
      breakdown: {
        isEmptyProfile: true,
        matchedSkills: [],
        missingSkills: [],
        criteria: [
          neutral("skills", "Profil vide"),
          neutral("title", "Profil vide"),
          neutral("contract", "Profil vide"),
          neutral("remote", "Profil vide"),
          neutral("salary", "Profil vide"),
          neutral("location", "Profil vide"),
        ],
      },
    };
  }

  const skills = evaluateSkills(offer, profile);
  const criteria: CriterionBreakdown[] = [
    skills.breakdown,
    evaluateTitle(offer, profile),
    evaluateContract(offer, profile),
    evaluateRemote(offer, profile),
    evaluateSalary(offer, profile),
    evaluateLocation(offer, profile),
  ];

  const active = criteria.filter(
    (c): c is CriterionBreakdown & { score: number } =>
      c.status !== "neutral" && c.score !== null,
  );

  if (active.length === 0) {
    return {
      score: null,
      breakdown: {
        isEmptyProfile: false,
        matchedSkills: skills.matchedSkills,
        missingSkills: skills.missingSkills,
        criteria,
      },
    };
  }

  const weightedSum = active.reduce((acc, c) => acc + c.score * c.weight, 0);
  const totalWeight = active.reduce((acc, c) => acc + c.weight, 0);
  const score = Math.max(0, Math.min(100, Math.round(weightedSum / totalWeight)));

  return {
    score,
    breakdown: {
      isEmptyProfile: false,
      matchedSkills: skills.matchedSkills,
      missingSkills: skills.missingSkills,
      criteria,
    },
  };
}
