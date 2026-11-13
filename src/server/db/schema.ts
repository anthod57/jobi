import { sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const remotePreferenceEnum = pgEnum("remote_preference", [
  "onsite",
  "hybrid",
  "remote",
  "flexible",
]);

export const contractTypeEnum = pgEnum("contract_type", [
  "cdi",
  "cdd",
  "alternance",
  "freelance",
  "interim",
  "stage",
]);

export const profiles = pgTable(
  "profiles",
  {
    id: serial("id").primaryKey(),
    fullName: varchar("full_name", { length: 200 }).notNull().default(""),
    headline: varchar("headline", { length: 300 }).default(""),
    email: varchar("email", { length: 320 }).default(""),
    phone: varchar("phone", { length: 40 }).default(""),
    locationLabel: varchar("location_label", { length: 200 })
      .notNull()
      .default(""),
    searchRadiusKm: integer("search_radius_km").notNull().default(30),
    remotePreference: remotePreferenceEnum("remote_preference")
      .notNull()
      .default("flexible"),
    minSalaryAnnualGross: integer("min_salary_annual_gross"),
    contractTypes: contractTypeEnum("contract_types")
      .array()
      .notNull()
      .default(sql`'{}'::contract_type[]`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "profiles_search_radius_km_check",
      sql`${table.searchRadiusKm} >= 0 AND ${table.searchRadiusKm} <= 500`,
    ),
  ],
);

export const profileSkills = pgTable(
  "profile_skills",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 120 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    uniqueIndex("profile_skills_profile_id_lower_label_unique").on(
      table.profileId,
      sql`lower(${table.label})`,
    ),
  ],
);

export const profileExperiences = pgTable("profile_experiences", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  company: varchar("company", { length: 200 }).notNull().default(""),
  location: varchar("location", { length: 200 }).default(""),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const profileCv = pgTable(
  "profile_cv",
  {
    profileId: integer("profile_id")
      .primaryKey()
      .references(() => profiles.id, { onDelete: "cascade" }),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    extractedText: text("extracted_text").notNull().default(""),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: "date" }),
    atsScore: smallint("ats_score"),
    atsFindings: jsonb("ats_findings").notNull().default(sql`'[]'::jsonb`),
    atsAnalyzedAt: timestamp("ats_analyzed_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [
    check(
      "profile_cv_ats_score_check",
      sql`${table.atsScore} IS NULL OR (${table.atsScore} >= 0 AND ${table.atsScore} <= 100)`,
    ),
  ],
);
