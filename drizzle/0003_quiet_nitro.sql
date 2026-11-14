CREATE TYPE "public"."application_status" AS ENUM('draft', 'validated', 'sent', 'archived');--> statement-breakpoint
CREATE TYPE "public"."application_tone" AS ENUM('professional', 'direct', 'enthusiastic');--> statement-breakpoint
CREATE TYPE "public"."llm_provider" AS ENUM('mistral', 'openai', 'anthropic');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"offer_id" integer NOT NULL,
	"status" "application_status" DEFAULT 'draft' NOT NULL,
	"tone" "application_tone" DEFAULT 'professional' NOT NULL,
	"custom_instructions" text DEFAULT '' NOT NULL,
	"draft_subject" varchar(300) DEFAULT '' NOT NULL,
	"draft_body" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"provider" "llm_provider" NOT NULL,
	"model" varchar(120) NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_usage_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"provider" "llm_provider" NOT NULL,
	"model" varchar(120) NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"estimated_cost_usd" varchar(24) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_offer_id_job_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."job_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_usage_logs" ADD CONSTRAINT "llm_usage_logs_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "applications_offer_id_unique" ON "applications" USING btree ("offer_id");