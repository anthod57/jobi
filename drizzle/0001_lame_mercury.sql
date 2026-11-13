CREATE TYPE "public"."ingestion_run_status" AS ENUM('running', 'success', 'partial', 'error');--> statement-breakpoint
CREATE TYPE "public"."offer_source" AS ENUM('france_travail', 'adzuna');--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" "offer_source" NOT NULL,
	"status" "ingestion_run_status" NOT NULL,
	"fetched_count" integer DEFAULT 0 NOT NULL,
	"inserted_count" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"deduped_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "integration_credentials" (
	"provider" varchar(40) PRIMARY KEY NOT NULL,
	"encrypted_payload" text NOT NULL,
	"key_hint" varchar(32) DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_offer_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"offer_id" integer NOT NULL,
	"source" "offer_source" NOT NULL,
	"external_id" varchar(160) NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"raw_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"dedup_key" varchar(64) NOT NULL,
	"title" varchar(300) NOT NULL,
	"company" varchar(200) DEFAULT '' NOT NULL,
	"location_label" varchar(200) DEFAULT '' NOT NULL,
	"department" varchar(20),
	"contract_type" "contract_type",
	"remote_mode" "remote_preference",
	"salary_min" integer,
	"salary_max" integer,
	"salary_text" varchar(200),
	"description" text DEFAULT '' NOT NULL,
	"published_at" timestamp with time zone,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "job_offers_salary_range_check" CHECK ("job_offers"."salary_min" IS NULL OR "job_offers"."salary_max" IS NULL OR "job_offers"."salary_min" <= "job_offers"."salary_max")
);
--> statement-breakpoint
ALTER TABLE "job_offer_sources" ADD CONSTRAINT "job_offer_sources_offer_id_job_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."job_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "job_offer_sources_source_external_id_unique" ON "job_offer_sources" USING btree ("source","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_offers_dedup_key_unique" ON "job_offers" USING btree ("dedup_key");