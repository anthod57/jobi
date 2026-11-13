CREATE TYPE "public"."contract_type" AS ENUM('cdi', 'cdd', 'alternance', 'freelance', 'interim', 'stage');--> statement-breakpoint
CREATE TYPE "public"."remote_preference" AS ENUM('onsite', 'hybrid', 'remote', 'flexible');--> statement-breakpoint
CREATE TABLE "profile_cv" (
	"profile_id" integer PRIMARY KEY NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"extracted_text" text DEFAULT '' NOT NULL,
	"uploaded_at" timestamp with time zone,
	"ats_score" smallint,
	"ats_findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ats_analyzed_at" timestamp with time zone,
	CONSTRAINT "profile_cv_ats_score_check" CHECK ("profile_cv"."ats_score" IS NULL OR ("profile_cv"."ats_score" >= 0 AND "profile_cv"."ats_score" <= 100))
);
--> statement-breakpoint
CREATE TABLE "profile_experiences" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"company" varchar(200) DEFAULT '' NOT NULL,
	"location" varchar(200) DEFAULT '',
	"start_date" date NOT NULL,
	"end_date" date,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" integer NOT NULL,
	"label" varchar(120) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(200) DEFAULT '' NOT NULL,
	"headline" varchar(300) DEFAULT '',
	"email" varchar(320) DEFAULT '',
	"phone" varchar(40) DEFAULT '',
	"location_label" varchar(200) DEFAULT '' NOT NULL,
	"search_radius_km" integer DEFAULT 30 NOT NULL,
	"remote_preference" "remote_preference" DEFAULT 'flexible' NOT NULL,
	"min_salary_annual_gross" integer,
	"contract_types" "contract_type"[] DEFAULT '{}'::contract_type[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_search_radius_km_check" CHECK ("profiles"."search_radius_km" >= 0 AND "profiles"."search_radius_km" <= 500)
);
--> statement-breakpoint
ALTER TABLE "profile_cv" ADD CONSTRAINT "profile_cv_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_experiences" ADD CONSTRAINT "profile_experiences_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_skills" ADD CONSTRAINT "profile_skills_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "profile_skills_profile_id_lower_label_unique" ON "profile_skills" USING btree ("profile_id",lower("label"));--> statement-breakpoint
INSERT INTO "profiles" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('profiles', 'id'), GREATEST((SELECT MAX("id") FROM "profiles"), 1));