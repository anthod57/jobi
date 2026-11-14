import { callLlmRaw } from "@/lib/candidatures/llm-client";
import { getDefaultModelForProvider } from "@/lib/candidatures/pricing";
import {
  getDecryptedCredential,
  type LlmApiKeyCredential,
  type LlmConfigCredential,
} from "@/lib/ingestion/credentials-repository";
import {
  extractCvStructuredDeterministic,
  normalizeStructuredCv,
  structuredCvSchema,
  type StructuredCv,
  type StructuredParseOutput,
} from "./cv-sections";

const CV_LLM_SYSTEM_PROMPT = `Tu es un parseur de CV ATS strict.
Extrais les informations du CV fourni et réponds UNIQUEMENT avec un objet JSON valide (sans markdown ni texte autour) respectant exactement cette structure :
{
  "contact": {
    "fullName": "string optionnel",
    "headline": "string optionnel",
    "location": "string optionnel",
    "emails": ["string"],
    "phones": ["string"],
    "urls": ["string"]
  },
  "experiences": [
    {
      "title": "string",
      "company": "string",
      "startDate": "string",
      "endDate": "string",
      "highlights": ["string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "school": "string",
      "year": "string"
    }
  ],
  "skills": ["string (compétences techniques uniquement)"],
  "softSkills": ["string (qualités humaines uniquement)"],
  "other": ["string (langues, centres d'intérêt, certifications diverses)"]
}
Règles : ne rien inventer, laisser [] ou "" si absent, séparer strictement skills, softSkills et other.`;

function extractJsonObject(rawText: string): unknown {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  return JSON.parse(candidate.slice(start, end + 1));
}

async function resolveActiveLlmConfig() {
  const config =
    await getDecryptedCredential<LlmConfigCredential>("llm_config");
  const activeProvider = config?.activeProvider ?? "mistral";
  const model =
    config?.model?.trim() || getDefaultModelForProvider(activeProvider);

  const keyCred = await getDecryptedCredential<LlmApiKeyCredential>(
    `llm_${activeProvider}`,
  );
  const apiKey = keyCred?.apiKey?.trim();
  if (!apiKey) return null;

  return { activeProvider, model, apiKey };
}

/** Returns true when an API key is configured for the active LLM provider. */
export async function hasConfiguredLlmKey(): Promise<boolean> {
  try {
    return (await resolveActiveLlmConfig()) !== null;
  } catch {
    return false;
  }
}

/** Parses CV text via the user's configured LLM; returns null on missing key or any failure. */
export async function parseCvWithLlm(
  text: string,
): Promise<StructuredCv | null> {
  if (!text.trim()) return null;

  try {
    const resolved = await resolveActiveLlmConfig();
    if (!resolved) {
      return null;
    }

    const raw = await callLlmRaw(
      resolved.activeProvider,
      resolved.apiKey,
      resolved.model,
      {
        system: CV_LLM_SYSTEM_PROMPT,
        user: text.slice(0, 24_000),
      },
    );

    const parsed = extractJsonObject(raw.text);
    return parsed && typeof parsed === "object"
      ? (parsed as StructuredCv)
      : null;
  } catch {
    return null;
  }
}

/** Hybrid structured CV parser: uses user LLM when available, silently falls back to deterministic. */
export async function parseCvStructured(
  text: string,
  llmFn: (input: string) => Promise<StructuredCv | null> = parseCvWithLlm,
): Promise<StructuredParseOutput> {
  try {
    const llmCandidate = await llmFn(text);
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
