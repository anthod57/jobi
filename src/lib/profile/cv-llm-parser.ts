import { callLlmRaw } from "@/lib/candidatures/llm-client";
import { getDefaultModelForProvider } from "@/lib/candidatures/pricing";
import {
  getDecryptedCredential,
  type LlmApiKeyCredential,
  type LlmConfigCredential,
} from "@/lib/ingestion/credentials-repository";
import type { StructuredCv } from "./cv-sections";

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

/** Parses CV text via the user's configured LLM; returns null on missing key or any failure. */
export async function parseCvWithLlm(
  text: string,
): Promise<StructuredCv | null> {
  if (!text.trim()) return null;

  try {
    const config =
      await getDecryptedCredential<LlmConfigCredential>("llm_config");
    const activeProvider = config?.activeProvider ?? "mistral";
    const model =
      config?.model?.trim() || getDefaultModelForProvider(activeProvider);

    const keyCred = await getDecryptedCredential<LlmApiKeyCredential>(
      `llm_${activeProvider}`,
    );
    if (!keyCred?.apiKey?.trim()) {
      return null;
    }

    const raw = await callLlmRaw(activeProvider, keyCred.apiKey, model, {
      system: CV_LLM_SYSTEM_PROMPT,
      user: text.slice(0, 24_000),
    });

    const parsed = extractJsonObject(raw.text);
    return parsed && typeof parsed === "object"
      ? (parsed as StructuredCv)
      : null;
  } catch {
    return null;
  }
}
