ALTER TABLE "orders" ADD COLUMN "delivery_proof_image_key" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "catchment_polygon" geometry(Polygon, 4326);