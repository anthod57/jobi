import type { ApplicationTone } from "./types";

const MAX_TEXT_CHARS = 6000;

export interface PromptOfferInput {
  title: string;
  company: string;
  locationLabel: string;
  contractType: string | null;
  remoteMode: string | null;
  description: string;
}

export interface PromptProfileExperience {
  title: string;
  company: string;
  description: string;
}

export interface PromptProfileInput {
  headline: string;
  skills: string[];
  experiences: PromptProfileExperience[];
  cvText: string;
}

export interface ApplicationPrompt {
  system: string;
  user: string;
}

const TONE_LABELS: Record<ApplicationTone, string> = {
  professional: "professional (courtois, structuré et formel)",
  direct: "direct (concis, factuel et orienté résultats)",
  enthusiastic: "enthusiastic (chaleureux, motivé et dynamique)",
};

function truncate(value: string, maxChars: number): string {
  const trimmed = value.trim();
  return trimmed.length > maxChars ? trimmed.slice(0, maxChars) : trimmed;
}

export function buildApplicationPrompt(
  offer: PromptOfferInput,
  profile: PromptProfileInput,
  tone: ApplicationTone,
  customInstructions: string,
): ApplicationPrompt {
  const system = [
    "Tu es un assistant spécialisé dans la rédaction de candidatures professionnelles en français.",
    "Réponds uniquement par un objet JSON valide de la forme {\"subject\": \"...\", \"body\": \"...\"}, sans texte autour.",
    "N'invente aucune expérience, compétence ou donnée personnelle absente du profil.",
    "N'ajoute jamais de nom fictif ni de placeholder de signature (ex. Jane Doe, [Votre nom]) : termine simplement par la formule de politesse (ex. « Cordialement, »).",
  ].join("\n");

  const experiencesBlock =
    profile.experiences.length > 0
      ? profile.experiences
          .map(
            (exp) =>
              `- ${exp.title} @ ${exp.company || "N/A"}: ${truncate(exp.description, 1000)}`,
          )
          .join("\n")
      : "Aucune expérience renseignée.";

  const skillsBlock =
    profile.skills.length > 0 ? profile.skills.join(", ") : "Aucune compétence renseignée.";

  const cvExcerpt = truncate(profile.cvText, MAX_TEXT_CHARS);
  const offerDescription = truncate(offer.description, MAX_TEXT_CHARS);
  const instructions = customInstructions.trim();

  const user = [
    `Ton souhaité : ${TONE_LABELS[tone]}`,
    instructions ? `Instructions spécifiques : ${instructions}` : "",
    "",
    "### Offre d'emploi",
    `Titre : ${offer.title}`,
    `Entreprise : ${offer.company || "Non précisée"}`,
    `Lieu : ${offer.locationLabel || "Non précisé"}`,
    `Contrat : ${offer.contractType ?? "Non précisé"}`,
    `Télétravail : ${offer.remoteMode ?? "Non précisé"}`,
    `Description :\n${offerDescription}`,
    "",
    "### Profil candidat (anonymisé)",
    `Titre : ${profile.headline || "Non précisé"}`,
    `Compétences : ${skillsBlock}`,
    `Expériences :\n${experiencesBlock}`,
    cvExcerpt ? `Extrait CV :\n${cvExcerpt}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { system, user };
}

/** Appends the user's real name locally after LLM generation, stripping any placeholder signature. */
export function appendCandidateSignature(body: string, fullName: string): string {
  const cleanedBody = body
    .replace(/\n*(?:\[?votre nom\]?|\[?prénom nom\]?|jane doe|john doe)\s*$/i, "")
    .trimEnd();
  const trimmedName = fullName.trim();
  if (!trimmedName) {
    return cleanedBody;
  }
  const alreadyEndsWithName = cleanedBody
    .toLowerCase()
    .endsWith(trimmedName.toLowerCase());
  if (alreadyEndsWithName) {
    return cleanedBody;
  }
  return `${cleanedBody}\n${trimmedName}`;
}
