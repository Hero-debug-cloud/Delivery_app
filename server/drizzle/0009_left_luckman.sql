ALTER TABLE "stores" ADD COLUMN "opening_time" text DEFAULT '10:00' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "closing_time" text DEFAULT '19:00' NOT NULL;