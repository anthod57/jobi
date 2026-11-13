import type {
  CriterionStatus,
  ScoreCriterionKey,
  ScoredOfferItem,
  ScoredOfferSource,
} from "@/lib/scoring/types";

type ContractType = NonNullable<ScoredOfferItem["contractType"]>;
type RemoteMode = NonNullable<ScoredOfferItem["remoteMode"]>;
type OfferSource = ScoredOfferSource["source"];

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  cdi: "CDI",
  cdd: "CDD",
  alternance: "Alternance",
  freelance: "Freelance",
  interim: "Intérim",
  stage: "Stage",
};

export const REMOTE_MODE_LABELS: Record<RemoteMode, string> = {
  onsite: "Sur site",
  hybrid: "Hybride",
  remote: "Télétravail",
  flexible: "Flexible",
};

export const SOURCE_LABELS: Record<OfferSource, string> = {
  france_travail: "France Travail",
  adzuna: "Adzuna",
};

export const SCORE_CRITERION_LABELS: Record<ScoreCriterionKey, string> = {
  skills: "Compétences",
  title: "Poste recherché",
  contract: "Type de contrat",
  remote: "Télétravail",
  salary: "Salaire",
  location: "Localisation",
};

export const CRITERION_STATUS_LABELS: Record<CriterionStatus, string> = {
  matched: "Correspond",
  partial: "Partiel",
  mismatch: "Écart",
  neutral: "Neutre",
};
