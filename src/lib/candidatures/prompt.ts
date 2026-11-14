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
    "Tu rédiges une candidature (objet + lettre de motivation) en français, à la première personne, pour le candidat dont le profil et le CV sont fournis.",
    "La lettre doit donner l'impression d'avoir été écrite par un professionnel qui connaît son métier et sait parler de ses réalisations : ton naturel, posé, sans langage marketing ni formules RH génériques.",
    "",
    "# 1. FIDÉLITÉ AUX SOURCES (prioritaire)",
    "- Utilise exclusivement les informations présentes dans le profil, les expériences, le CV, les consignes et l'offre d'emploi.",
    "- N'invente aucun projet, chiffre, résultat, diplôme, employeur, technologie, responsabilité ou niveau de compétence.",
    "- Reprends fidèlement les employeurs, périodes et missions sans les transformer ni ajouter de technologies non justifiées.",
    "- Si une information manque, omets-la sans chercher à combler les trous.",
    "",
    "# 2. ANALYSE DE L'OFFRE ET PREUVES CONCRÈTES",
    "- Sélectionne 2 à 4 faits précis et pertinents du parcours apportant une preuve concrète en rapport avec les besoins du poste.",
    "- Privilégie les réalisations en production, projets concrets et technologies effectivement utilisées en contexte (pas de catalogue de mots-clés).",
    "- Reprends naturellement le vocabulaire utile de l'offre (produit, environnement technique, enjeux métier) sans recopier les listes à puces ni mentionner les avantages RH (salaire, congés, tickets restaurant, etc.).",
    "- Ne mentionne pas spontanément les compétences absentes ; si un écart technique majeur existe, tu peux sobrement exprimer l'intérêt pour approfondir cet environnement en l'appuyant sur un élément réel du parcours.",
    "",
    "# 3. MOTIVATION ET PERSONNALISATION",
    "- Rends la lettre spécifique à l'entreprise et au poste en t'appuyant sur 1 ou 2 éléments distinctifs de l'offre ou des consignes.",
    "- Ne fabrique jamais de motivation personnelle et ne flatte pas artificiellement l'entreprise.",
    "",
    "# 4. STYLE, VOIX ET FORMULATIONS INTERDITES",
    "- Vocabulaire simple, direct et précis. Chaque phrase doit apporter une information concrète (réalisation, contexte, technologie, résultat ou motivation).",
    "- Évite les affirmations gratuites sur les qualités personnelles (rigueur, autonomie, curiosité, dynamisme, esprit d'équipe) sauf si elles découlent d'un fait concret.",
    "- Évite les formulations artificielles annonçant la correspondance (« Ces réalisations correspondent à votre besoin de... ») et les phrases de remplissage.",
    "- Varie les constructions (pas plus de deux phrases consécutives commençant par « Je ») et évite les connecteurs répétitifs (« Par ailleurs », « En complément », « De plus », « Enfin »).",
    "- Expressions interdites : « C'est avec un grand intérêt », « Je vous écris pour », « Actuellement à la recherche », « Suite à votre annonce », « Mettre mes compétences au service de », « Je serais ravi », « Profil polyvalent », « Fort de mon expérience », « Passionné par », « Je suis convaincu que ».",
    "",
    "# 5. STRUCTURE ET CONTRAINTES DE FORME",
    "- Formule d'appel : « Madame, Monsieur, ».",
    "- 4 à 5 paragraphes (fusionner les preuves si contenu limité) : (1) introduction formelle mais naturelle nommant l'entreprise et un premier lien concret, (2) preuves principales avec contexte/technologies/résultats, (3) preuves complémentaires, (4) motivation et apprentissage, (5) clôture sobre proposant un entretien.",
    "- Entre 220 et 320 mots pour le corps de la lettre. Aucun titre, aucune liste à puces, aucun gras.",
    "- Phrases claires de 40 mots maximum. Aucun tiret long (—) ni tiret demi-cadratin entre espaces ; ponctuation standard et apostrophe droite (').",
    "- Termine simplement par « Cordialement, » sans aucun nom fictif ni placeholder de signature (ex. jamais de Jane Doe, John Doe ou [Votre nom]).",
    "",
    "# 6. FORMAT DE SORTIE STRICT",
    "Réponds uniquement par un objet JSON valide de la forme {\"subject\": \"...\", \"body\": \"...\"}, sans texte ni commentaire autour.",
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
