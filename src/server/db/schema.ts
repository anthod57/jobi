import { sql } from "drizzle-orm";
import {
  boolean,
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

export const offerSourceEnum = pgEnum("offer_source", [
  "france_travail",
  "adzuna",
]);

export const ingestionRunStatusEnum = pgEnum("ingestion_run_status", [
  "running",
  "success",
  "partial",
  "error",
]);

export const jobOffers = pgTable(
  "job_offers",
  {
    id: serial("id").primaryKey(),
    dedupKey: varchar("dedup_key", { length: 64 }).notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    company: varchar("company", { length: 200 }).notNull().default(""),
    locationLabel: varchar("location_label", { length: 200 })
      .notNull()
      .default(""),
    department: varchar("department", { length: 20 }),
    contractType: contractTypeEnum("contract_type"),
    remoteMode: remotePreferenceEnum("remote_mode"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryText: varchar("salary_text", { length: 200 }),
    description: text("description").notNull().default(""),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("job_offers_dedup_key_unique").on(table.dedupKey),
    check(
      "job_offers_salary_range_check",
      sql`${table.salaryMin} IS NULL OR ${table.salaryMax} IS NULL OR ${table.salaryMin} <= ${table.salaryMax}`,
    ),
  ],
);

export const jobOfferSources = pgTable(
  "job_offer_sources",
  {
    id: serial("id").primaryKey(),
    offerId: integer("offer_id")
      .notNull()
      .references(() => jobOffers.id, { onDelete: "cascade" }),
    source: offerSourceEnum("source").notNull(),
    externalId: varchar("external_id", { length: 160 }).notNull(),
    url: text("url").notNull().default(""),
    rawPayload: jsonb("raw_payload").notNull().default(sql`'{}'::jsonb`),
    fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("job_offer_sources_source_external_id_unique").on(
      table.source,
      table.externalId,
    ),
  ],
);

export const ingestionRuns = pgTable("ingestion_runs", {
  id: serial("id").primaryKey(),
  source: offerSourceEnum("source").notNull(),
  status: ingestionRunStatusEnum("status").notNull(),
  fetchedCount: integer("fetched_count").notNull().default(0),
  insertedCount: integer("inserted_count").notNull().default(0),
  updatedCount: integer("updated_count").notNull().default(0),
  dedupedCount: integer("deduped_count").notNull().default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true, mode: "date" }),
});

export const integrationCredentials = pgTable("integration_credentials", {
  provider: varchar("provider", { length: 40 }).primaryKey(),
  encryptedPayload: text("encrypted_payload").notNull(),
  keyHint: varchar("key_hint", { length: 32 }).notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const offerScores = pgTable(
  "offer_scores",
  {
    offerId: integer("offer_id")
      .primaryKey()
      .references(() => jobOffers.id, { onDelete: "cascade" }),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    score: smallint("score"),
    breakdown: jsonb("breakdown").notNull().default(sql`'{}'::jsonb`),
    computedAt: timestamp("computed_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "offer_scores_score_check",
      sql`${table.score} IS NULL OR (${table.score} >= 0 AND ${table.score} <= 100)`,
    ),
  ],
);
