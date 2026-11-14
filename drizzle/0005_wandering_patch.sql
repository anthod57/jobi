ALTER TABLE "profile_cv" ADD COLUMN "structured_sections" jsonb DEFAULT 'null'::jsonb;--> statement-breakpoint
ALTER TABLE "profile_cv" ADD COLUMN "parse_mode" varchar(20) DEFAULT 'deterministic' NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_cv" ADD COLUMN "is_multi_column" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_cv" ADD COLUMN "page_count" smallint DEFAULT 1 NOT NULL;