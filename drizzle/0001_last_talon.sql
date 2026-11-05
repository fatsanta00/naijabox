ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'player';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_favourites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"box_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_favourites_user_box_unique" UNIQUE("user_id","box_slug")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" text;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user_favourites" ADD CONSTRAINT "user_favourites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_favourites_user_idx" ON "user_favourites" USING btree ("user_id");