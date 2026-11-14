import { z } from "zod";
import {
  findEmails,
  linesOf,
  normalizeForMatch,
} from "@/lib/profile/ats/text-helpers";
import { parseCvWithLlm } from "./cv-llm-parser";
import type { CvLayoutMeta } from "./cv-parse";

export type { CvLayoutMeta };

export type CvParseMode = "llm" | "deterministic";

export interface CvStructuredExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  highlights: string[];
}

export interface CvStructuredEducation {
  degree: string;
  school: string;
  year: string;
}

export interface CvStructuredContact {
  fullName?: string;
  headline?: string;
  location?: string;
  emails: string[];
  phones: string[];
  urls: string[];
}

export interface StructuredCv {
  contact: CvStructuredContact;
  experiences: CvStructuredExperience[];
  education: CvStructuredEducation[];
  skills: string[];
  softSkills: string[];
  other: string[];
}

export interface StructuredParseOutput {
  structured: StructuredCv;
  mode: CvParseMode;
}

export const structuredCvSchema = z.object({
  contact: z.object({
    fullName: z.string().optional(),
    headline: z.string().optional(),
    location: z.string().optional(),
    emails: z.array(z.string()),
    phones: z.array(z.string()),
    urls: z.array(z.string()),
  }),
  experiences: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      highlights: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      school: z.string(),
      year: z.string(),
    }),
  ),
  skills: z.array(z.string()),
  softSkills: z.array(z.string()),
  other: z.array(z.string()),
});

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
      /^(?:diplomes?(?:\s+et\s+formations?)?|formations?(?:\s+(?:&|et)\s+diplomes?)?|education|etudes|certifications?)$/,
  },
  {
    key: "contact",
    pattern: /^(?:contact|coordonnees|informations\s+personnelles)$/,
  },
  {
    key: "other",
    pattern:
      /^(?:langues|languages|projets|projects|centres\s+d['’]interet|interets|loisirs|profil|a\s+propos|resume)$/,
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
  // Strip category subtitle prefix such as "Langages : TypeScript, Python"
  const colonIdx = cleaned.indexOf(":");
  const body =
    colonIdx > 0 && colonIdx < 35 && !/^https?:/i.test(cleaned)
      ? cleaned.slice(colonIdx + 1).trim()
      : cleaned;
  if (!body) return [];
  if (/[•|,]/.test(body)) {
    return body
      .split(/[•|,]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && !item.endsWith(":"));
  }
  return body.endsWith(":") ? [] : [body];
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}

function dedupeCaseInsensitive(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function normalizeCvUrl(rawUrl: string): string {
  return rawUrl
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}

function normalizeStructuredCv(cv: StructuredCv): StructuredCv {
  return {
    contact: {
      ...cv.contact,
      emails: dedupeCaseInsensitive(cv.contact.emails),
      phones: dedupe(cv.contact.phones.map((p) => p.trim()).filter(Boolean)),
      urls: dedupeCaseInsensitive(cv.contact.urls.map(normalizeCvUrl)),
    },
    experiences: cv.experiences.map((exp) => ({
      ...exp,
      title: exp.title.trim(),
      company: exp.company.trim(),
      startDate: exp.startDate.trim(),
      endDate: exp.endDate.trim(),
      highlights: exp.highlights.map((h) => h.trim()).filter(Boolean),
    })),
    education: cv.education.map((edu) => ({
      ...edu,
      degree: edu.degree.trim(),
      school: edu.school.trim(),
      year: edu.year.trim(),
    })),
    skills: dedupeCaseInsensitive(cv.skills),
    softSkills: dedupeCaseInsensitive(cv.softSkills),
    other: dedupe(cv.other.map((o) => o.trim()).filter(Boolean)),
  };
}

function parseExperienceLines(lines: string[]): CvStructuredExperience[] {
  const experiences: CvStructuredExperience[] = [];
  const dateRangeRe =
    /\(?\s*(\d{4}|(?:janv?|fevr?|mars|avr|mai|juin|juil|aout|sept?|oct|nov|dec)[a-z.]*\s+\d{4})\s*[-–—]\s*(\d{4}|present|aujourd'hui|actuel|(?:janv?|fevr?|mars|avr|mai|juin|juil|aout|sept?|oct|nov|dec)[a-z.]*\s+\d{4})\s*\)?/i;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (/^[-•*]\s+/.test(line) && experiences.length > 0) {
      experiences[experiences.length - 1].highlights.push(
        line.replace(/^[-•*]\s+/, "").trim(),
      );
      continue;
    }

    const dateMatch = line.match(dateRangeRe);
    const startDate = dateMatch ? dateMatch[1].trim() : "";
    const endDate = dateMatch ? dateMatch[2].trim() : "";
    const withoutDates = dateMatch
      ? line.replace(dateMatch[0], "").trim()
      : line;

    const parts = withoutDates.split(/\s+[—–-]\s+|\s+@\s+/);
    const title = (parts[0] ?? withoutDates).trim();
    const company = (parts[1] ?? "").trim();

    experiences.push({
      title: title || line,
      company,
      startDate,
      endDate,
      highlights: [],
    });
  }

  return experiences;
}

function parseEducationLines(lines: string[]): CvStructuredEducation[] {
  const education: CvStructuredEducation[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const yearMatch = line.match(/\b(19\d{2}|20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : "";
    const withoutYear = year
      ? line.replace(new RegExp(`\\(?\\s*${year}\\s*\\)?`), "").trim()
      : line;
    const parts = withoutYear.split(/\s+[—–-]\s+/);
    education.push({
      degree: (parts[0] ?? withoutYear).trim() || line,
      school: (parts[1] ?? "").trim(),
      year,
    });
  }
  return education;
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
  result.skills = dedupeCaseInsensitive(result.skills);
  result.softSkills = dedupeCaseInsensitive(result.softSkills);

  return result;
}

/** Deterministic structured CV extraction (100% local, zero LLM). */
export function extractCvStructuredDeterministic(text: string): StructuredCv {
  const sections = extractCvSections(text);
  const emails = findEmails(text);
  const phones = (text.match(PHONE_EXTRACT_PATTERN) ?? []).map((p) => p.trim());
  const urls = (text.match(URL_EXTRACT_PATTERN) ?? []).map(normalizeCvUrl);

  const firstLines = linesOf(text)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3);
  const fullName =
    firstLines[0] &&
    !firstLines[0].includes("@") &&
    !/https?:\/\//i.test(firstLines[0]) &&
    !detectSectionHeading(firstLines[0])
      ? firstLines[0]
      : undefined;

  return normalizeStructuredCv({
    contact: {
      fullName,
      emails,
      phones,
      urls,
    },
    experiences: parseExperienceLines(sections.experiences),
    education: parseEducationLines(sections.education),
    skills: sections.skills,
    softSkills: sections.softSkills,
    other: sections.other,
  });
}

/** Hybrid structured CV parser: uses user LLM when available, silently falls back to deterministic. */
export async function parseCvStructured(
  text: string,
): Promise<StructuredParseOutput> {
  try {
    const llmCandidate = await parseCvWithLlm(text);
    if (llmCandidate) {
      const validated = structuredCvSchema.safeParse(llmCandidate);
      if (validated.success) {
        return {
          structured: normalizeStructuredCv(validated.data),
          mode: "llm",
        };
      }
    }
  } catch {
    // Silent fallback to deterministic parser on any LLM error or timeout.
  }

  return {
    structured: extractCvStructuredDeterministic(text),
    mode: "deterministic",
  };
}
