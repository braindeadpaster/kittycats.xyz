ALTER TABLE "page_views" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "latitude" text;--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "longitude" text;--> statement-breakpoint
CREATE INDEX "page_views_user_ip_created_idx" ON "page_views" USING btree ("user_id","ip","created_at");
