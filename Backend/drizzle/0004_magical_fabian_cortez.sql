CREATE TABLE IF NOT EXISTS "inventory_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier" text NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" double precision NOT NULL,
	"purchase_date" timestamp NOT NULL,
	"lead_time_days" integer DEFAULT 7 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ADD COLUMN IF NOT EXISTS "impressions" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ADD COLUMN IF NOT EXISTS "orders_generated" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ADD COLUMN IF NOT EXISTS "revenue_generated" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" "payment_method" DEFAULT 'COD' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_cost" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "reorder_level" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_purchases_product_id_products_id_fk' AND conrelid = 'public.inventory_purchases'::regclass) THEN
		ALTER TABLE "inventory_purchases" ADD CONSTRAINT "inventory_purchases_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;