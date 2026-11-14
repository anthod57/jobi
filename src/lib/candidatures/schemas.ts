import { z } from "zod";

export const llmProviderSchema = z.enum(["mistral", "openai", "anthropic"]);
export const applicationStatusSchema = z.enum(["draft", "validated", "sent", "archived"]);
export const applicationToneSchema = z.enum(["professional", "direct", "enthusiastic"]);

export const llmKeySchema = z.object({
  provider: llmProviderSchema,
  apiKey: z.string().trim().min(8).max(300),
});

export const llmConfigSchema = z.object({
  activeProvider: llmProviderSchema,
  model: z.string().trim().min(1).max(120),
});

export const generateDraftSchema = z.object({
  offerId: z.coerce.number().int().positive(),
  tone: applicationToneSchema.default("professional"),
  customInstructions: z.string().trim().max(600).default(""),
});

export const updateApplicationSchema = z.object({
  applicationId: z.coerce.number().int().positive(),
  status: applicationStatusSchema.optional(),
  draftSubject: z.string().trim().max(300).optional(),
  draftBody: z.string().trim().max(15000).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export const applicationFiltersSchema = z.object({
  status: applicationStatusSchema.optional(),
  q: z.string().trim().max(120).default(""),
});
