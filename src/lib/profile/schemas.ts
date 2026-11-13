import { z } from "zod";

const contractTypeSchema = z.enum([
  "cdi",
  "cdd",
  "alternance",
  "freelance",
  "interim",
  "stage",
]);

const remotePreferenceSchema = z.enum([
  "onsite",
  "hybrid",
  "remote",
  "flexible",
]);

export const profileUpdateInputSchema = z
  .object({
    fullName: z.string().max(200),
    headline: z.string().max(300).optional().default(""),
    email: z.union([z.string().email(), z.literal("")]),
    phone: z.string().max(40),
    locationLabel: z.string().min(1).max(200),
    searchRadiusKm: z.number().int().min(0).max(500),
    remotePreference: remotePreferenceSchema,
    minSalaryAnnualGross: z.number().int().positive().nullable(),
    contractTypes: z.array(contractTypeSchema).max(6),
    skills: z.array(z.string().trim().min(1).max(120)).max(80),
    experiences: z
      .array(
        z.object({
          title: z.string().min(1).max(200),
          company: z.string().max(200),
          location: z.string().max(200).optional().default(""),
          startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
          description: z.string().max(8000),
          sortOrder: z.number().int().min(0).optional(),
        }),
      )
      .max(40),
  })
  .strict();

export type ProfileUpdateInput = z.infer<typeof profileUpdateInputSchema>;
