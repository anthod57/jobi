import {
  findEmails,
  linesOf,
  normalizeForMatch,
} from "@/lib/profile/ats/text-helpers";

export type CvSectionKey =
  | "contact"
  | "experiences"
  | "skills"
  | "softSkills"
  | "education"
  | "other";

export type CvExtractedSections = Record<CvSectionKey, string[]>;

const PHONE_EXTRACT_PATTERN =
  /(?:\+33|0)\s*[1-9](?:[\s.-]*\d{2}){4}|\+\d{1,3}[\s.-]?\d{1,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}/g;

const URL_EXTRACT_PATTERN = /https?:\/\/[^\s|,;)]+/gi;

const SECTION_HEADINGS: { key: CvSectionKey; pattern: RegExp }[] = [
  {
    key: "softSkills",
    pattern: /^(?:soft[\s-]?skills?|savoir[\s-]?etre|qualites(?:\s+personnelles)?|atouts)$/,
  },
  {
    key: "skills",
    pattern:
      /^(?:competences(?:\s+techniques)?|skills|technical\s+skills|savoir[\s-]?faire|stack(?:\s+technique)?|technologies|outils)$/,
  },
  {
    key: "experiences",
    pattern:
      /^(?:experiences?(?:\s+professionnelles?)?|parcours(?:\s+professionnel)?|work\s+(?:experience|history)|emplois?)$/,
  },
  {
    key: "education",
    pattern:
      /^(?:formations?(?:\s+&\s+diplomes)?|diplomes?|education|etudes|certifications?)$/,
  },
  {
    key: "contact",
    pattern: /^(?:contact|coordonnees|informations\s+personnelles)$/,
  },
  {
    key: "other",
    pattern: /^(?:langues|languages|projets|projects|centres\s+d['’]interet|interets|profil|a\s+propos|resume)$/,
  },
];

function detectSectionHeading(line: string): CvSectionKey | null {
  if (line.length > 60) return null;
  const normalized = normalizeForMatch(line)
    .replace(/[:\-–—•|]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return null;
  for (const { key, pattern } of SECTION_HEADINGS) {
    if (pattern.test(normalized)) return key;
  }
  return null;
}

function splitSkillTokens(line: string): string[] {
  const cleaned = line.replace(/^[-•*]\s*/, "").trim();
  if (!cleaned) return [];
  if (/[•|,]/.test(cleaned)) {
    return cleaned
      .split(/[•|,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [cleaned];
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}

/** Splits extracted CV text into structured sections for UI preview. */
export function extractCvSections(text: string): CvExtractedSections {
  const result: CvExtractedSections = {
    contact: [],
    experiences: [],
    skills: [],
    softSkills: [],
    education: [],
    other: [],
  };

  if (!text.trim()) return result;

  const emails = findEmails(text);
  const phones = (text.match(PHONE_EXTRACT_PATTERN) ?? []).map((p) => p.trim());
  const urls = text.match(URL_EXTRACT_PATTERN) ?? [];
  result.contact.push(...dedupe([...emails, ...phones, ...urls]));

  let current: CvSectionKey = "other";

  for (const rawLine of linesOf(text)) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = detectSectionHeading(line);
    if (heading) {
      current = heading;
      continue;
    }

    if (current === "skills" || current === "softSkills") {
      result[current].push(...splitSkillTokens(line));
      continue;
    }

    if (current === "other") {
      const stripped = line
        .replace(URL_EXTRACT_PATTERN, "")
        .replace(PHONE_EXTRACT_PATTERN, "")
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "")
        .replace(/[\s|,;/-]+/g, " ")
        .trim();
      if (!stripped) continue;
    }

    result[current].push(line);
  }

  result.contact = dedupe(result.contact);
  result.skills = dedupe(result.skills);
  result.softSkills = dedupe(result.softSkills);

  return result;
}
