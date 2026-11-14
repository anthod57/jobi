export type LlmProvider = "mistral" | "openai" | "anthropic";

export type ApplicationStatus = "draft" | "validated" | "sent" | "archived";

export type ApplicationTone = "professional" | "direct" | "enthusiastic";

export interface LlmGenerationResult {
  subject: string;
  body: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface ApplicationWithOffer {
  id: number;
  offerId: number;
  status: ApplicationStatus;
  tone: ApplicationTone;
  customInstructions: string;
  draftSubject: string;
  draftBody: string;
  notes: string;
  provider: LlmProvider;
  model: string;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  offerTitle: string;
  offerCompany: string;
  offerLocationLabel: string;
  offerContractType: string | null;
  offerRemoteMode: string | null;
}

export interface CandidatureStats {
  totalApplications: number;
  byStatus: Record<"draft" | "validated" | "sent" | "archived", number>;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  usageByProvider: Array<{
    provider: "mistral" | "openai" | "anthropic";
    calls: number;
    totalTokens: number;
    costUsd: number;
  }>;
}
