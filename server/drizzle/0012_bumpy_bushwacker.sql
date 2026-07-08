DO $$ BEGIN
 CREATE TYPE "public"."payroll_status" AS ENUM('draft', 'approved', 'hold', 'paid');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payroll_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid,
	"per_order_rate" integer DEFAULT 2000 NOT NULL,
	"per_km_rate" integer DEFAULT 500 NOT NULL,
	"night_surge_rate" integer DEFAULT 1000 NOT NULL,
	"weather_surge_rate" integer DEFAULT 1500 NOT NULL,
	"late_penalty" integer DEFAULT 500 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payroll_ledgers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"total_deliveries" integer DEFAULT 0 NOT NULL,
	"total_distance_meters" integer DEFAULT 0 NOT NULL,
	"base_order_earnings" integer DEFAULT 0 NOT NULL,
	"distance_earnings" integer DEFAULT 0 NOT NULL,
	"bonus_earnings" integer DEFAULT 0 NOT NULL,
	"penalty_deductions" integer DEFAULT 0 NOT NULL,
	"net_payout" integer DEFAULT 0 NOT NULL,
	"status" "payroll_status" DEFAULT 'draft' NOT NULL,
	"payment_reference" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payroll_configurations" ADD CONSTRAINT "payroll_configurations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payroll_ledgers" ADD CONSTRAINT "payroll_ledgers_driver_id_delivery_partners_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."delivery_partners"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payroll_ledgers" ADD CONSTRAINT "payroll_ledgers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payroll_configurations_store_id_unique_idx" ON "payroll_configurations" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payroll_ledgers_store_date_range_idx" ON "payroll_ledgers" USING btree ("store_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payroll_ledgers_driver_date_range_idx" ON "payroll_ledgers" USING btree ("driver_id","start_date","end_date");