CREATE TABLE "offer_scores" (
	"offer_id" integer PRIMARY KEY NOT NULL,
	"profile_id" integer NOT NULL,
	"score" smallint,
	"breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offer_scores_score_check" CHECK ("offer_scores"."score" IS NULL OR ("offer_scores"."score" >= 0 AND "offer_scores"."score" <= 100))
);
--> statement-breakpoint
ALTER TABLE "offer_scores" ADD CONSTRAINT "offer_scores_offer_id_job_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."job_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_scores" ADD CONSTRAINT "offer_scores_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;