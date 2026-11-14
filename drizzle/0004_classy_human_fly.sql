CREATE INDEX "applications_status_updated_at_idx" ON "applications" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "ingestion_runs_started_at_idx" ON "ingestion_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "job_offer_sources_offer_id_idx" ON "job_offer_sources" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "job_offers_active_published_idx" ON "job_offers" USING btree ("is_active","published_at");--> statement-breakpoint
CREATE INDEX "offer_scores_score_idx" ON "offer_scores" USING btree ("score");