import { z } from "zod";

export const offerFiltersSchema = z.object({
  q: z.string().trim().max(120).default(""),
  contractType: z
    .enum(["cdi", "cdd", "alternance", "freelance", "interim", "stage"])
    .optional(),
  remoteMode: z.enum(["onsite", "hybrid", "remote", "flexible"]).optional(),
  source: z.enum(["france_travail", "adzuna"]).optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  sort: z.enum(["score", "date"]).default("score"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type OfferFilters = z.infer<typeof offerFiltersSchema>;
