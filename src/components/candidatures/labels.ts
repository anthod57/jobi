import type { BadgeProps } from "@/components/ui";
import type {
  ApplicationStatus,
  ApplicationTone,
  LlmProvider,
} from "@/lib/candidatures/types";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Brouillon",
  validated: "Validée",
  sent: "Envoyée",
  archived: "Archivée",
};

export const APPLICATION_STATUS_COLORS: Record<
  ApplicationStatus,
  NonNullable<BadgeProps["color"]>
> = {
  draft: "warning",
  validated: "info",
  sent: "success",
  archived: "gray",
};

export const APPLICATION_TONE_LABELS: Record<ApplicationTone, string> = {
  professional: "Professionnel",
  direct: "Direct",
  enthusiastic: "Enthousiaste",
};

export const LLM_PROVIDER_LABELS: Record<LlmProvider, string> = {
  mistral: "Mistral",
  openai: "OpenAI",
  anthropic: "Anthropic",
};
