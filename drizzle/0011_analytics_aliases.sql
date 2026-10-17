ALTER TABLE "page_views" ADD COLUMN "ip" text;--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "device" text;--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "referrer" text;--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "user_agent" text;--> statement-breakpoint
CREATE INDEX "page_views_user_created_idx" ON "page_views" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "social_links" ADD COLUMN "clicks" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE TABLE "aliases" (
	"id" text PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::text,
	"user_id" integer NOT NULL,
	"alias" text NOT NULL UNIQUE,
	"created_at" timestamptz NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
ALTER TABLE "aliases" ADD CONSTRAINT "aliases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aliases_user_id_idx" ON "aliases" USING btree ("user_id");
