DO $$ BEGIN
 CREATE TYPE "public"."onboarding_status" AS ENUM('pending', 'submitted', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "delivery_partners" ALTER COLUMN "vehicle_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_partners" ALTER COLUMN "vehicle_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_partners" ADD COLUMN "onboarding_status" "onboarding_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_partners" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "delivery_partners" ADD COLUMN "license_number" text;--> statement-breakpoint
ALTER TABLE "delivery_partners" ADD COLUMN "license_expiry" text;--> statement-breakpoint
ALTER TABLE "delivery_partners" ADD COLUMN "license_front_url" text;--> statement-breakpoint
ALTER TABLE "delivery_partners" ADD COLUMN "license_back_url" text;--> statement-breakpoint
ALTER TABLE "delivery_partners" ADD COLUMN "vehicle_plate_image" text;--> statement-breakpoint
ALTER TABLE "delivery_partners" ADD COLUMN "identity_proof_type" text;--> statement-breakpoint
ALTER TABLE "delivery_partners" ADD COLUMN "identity_proof_number" text;--> statement-breakpoint
ALTER TABLE "delivery_partners" ADD COLUMN "identity_proof_image" text;--> statement-breakpoint
ALTER TABLE "delivery_partners" ADD COLUMN "profile_picture_url" text;