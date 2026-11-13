const DIACRITIC_MAP: Record<string, string> = {
  à: "a",
  â: "a",
  ä: "a",
  é: "e",
  è: "e",
  ê: "e",
  ë: "e",
  î: "i",
  ï: "i",
  ô: "o",
  ö: "o",
  ù: "u",
  û: "u",
  ü: "u",
  ç: "c",
};

export function normalizeForMatch(text: string): string {
  let out = text.toLowerCase();
  for (const [accent, plain] of Object.entries(DIACRITIC_MAP)) {
    out = out.replaceAll(accent, plain);
  }
  return out;
}

export function linesOf(text: string): string[] {
  return text.split(/\r?\n/);
}

const EMAIL_PATTERN =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const EMAIL_LIKE_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{0,}/g;

export function findEmails(text: string): string[] {
  return text.match(EMAIL_PATTERN) ?? [];
}

export function findEmailLikeInvalidTld(text: string): boolean {
  const likes = text.match(EMAIL_LIKE_PATTERN) ?? [];
  return likes.some((token) => {
    const valid = token.match(EMAIL_PATTERN);
    return !valid;
  });
}

const PHONE_PATTERN =
  /(?:\+33|0)\s*[1-9](?:[\s.-]*\d{2}){4}|\+\d{1,3}[\s.-]?\d{1,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}/;

export function hasPhonePattern(text: string): boolean {
  return PHONE_PATTERN.test(text);
}

export function skillInText(skill: string, text: string): boolean {
  const needle = normalizeForMatch(skill.trim());
  if (!needle) return false;
  return normalizeForMatch(text).includes(needle);
}

export function skillsCoverageRatio(
  skills: string[],
  text: string,
): number | null {
  if (skills.length === 0) return null;
  const matched = skills.filter((s) => skillInText(s, text)).length;
  return matched / skills.length;
}

const YEAR_PATTERN = /\b(19|20)\d{2}\b/;
const MONTH_YEAR_PATTERN = /\b(0?[1-9]|1[0-2])[/.-](19|20)\d{2}\b/;
const ISO_DATE_PATTERN = /\b(19|20)\d{2}-\d{2}-\d{2}\b/;
const FR_MONTH_NAMES =
  /(?:janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\s+(?:de\s+)?(19|20)\d{2}/i;

export function hasAnyDatePattern(text: string): boolean {
  return (
    YEAR_PATTERN.test(text) ||
    MONTH_YEAR_PATTERN.test(text) ||
    ISO_DATE_PATTERN.test(text) ||
    FR_MONTH_NAMES.test(text)
  );
}

export type DateFormatFamily = "year" | "monthYear" | "iso" | "frMonth";

export function dateFormatFamiliesPresent(text: string): Set<DateFormatFamily> {
  const families = new Set<DateFormatFamily>();
  if (YEAR_PATTERN.test(text)) families.add("year");
  if (MONTH_YEAR_PATTERN.test(text)) families.add("monthYear");
  if (ISO_DATE_PATTERN.test(text)) families.add("iso");
  if (FR_MONTH_NAMES.test(text)) families.add("frMonth");
  return families;
}

export function parseLatestExperienceEndYear(text: string): number | null {
  const years: number[] = [];
  const isoDates = text.match(/\b(19|20)\d{2}-\d{2}-\d{2}\b/g) ?? [];
  for (const d of isoDates) {
    years.push(Number.parseInt(d.slice(0, 4), 10));
  }
  const monthYears = text.match(/\b(?:0?[1-9]|1[0-2])[/.-]((19|20)\d{2})\b/g) ?? [];
  for (const d of monthYears) {
    const y = d.match(/(19|20)\d{2}/);
    if (y) years.push(Number.parseInt(y[0], 10));
  }
  const frMonths = [
    ...text.matchAll(
      /(?:janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\s+(?:de\s+)?((19|20)\d{2})/gi,
    ),
  ];
  for (const m of frMonths) {
    years.push(Number.parseInt(m[1], 10));
  }
  if (years.length === 0) return null;
  return Math.max(...years);
}

const EXPERIENCE_KEYWORDS =
  /\b(expérience|experience|emploi|positions held|parcours professionnel|work history)\b/i;
const EDUCATION_KEYWORDS =
  /\b(formation|diplôme|diplome|education|degree|études|etudes)\b/i;
const SKILLS_KEYWORDS =
  /\b(compétences|competences|skills|savoir-faire|technical skills)\b/i;

const SECTION_KEYWORDS =
  /\b(expérience|experience|formation|compétences|competences|skills|education|diplôme|diplome|emploi)\b/i;

export function hasExperienceSection(text: string): boolean {
  return EXPERIENCE_KEYWORDS.test(text);
}

export function hasEducationSection(text: string): boolean {
  return EDUCATION_KEYWORDS.test(text);
}

export function hasSkillsSection(text: string): boolean {
  return SKILLS_KEYWORDS.test(text);
}

export function hasSectionKeyword(text: string): boolean {
  return SECTION_KEYWORDS.test(text);
}

const ACTION_VERBS =
  /\b(développé|développe|realise|realisé|réalisé|géré|gere|animé|anime|piloté|pilote|conçu|concu|optimisé|optimise|coordonné|coordonne|amélioré|améliore|créé|cree|mené|mene|supervisé|supervise)\b/i;

export function actionVerbCount(text: string): number {
  return (text.match(new RegExp(ACTION_VERBS.source, "gi")) ?? []).length;
}
