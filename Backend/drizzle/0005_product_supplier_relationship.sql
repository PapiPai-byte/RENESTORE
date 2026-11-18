CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "suppliers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "supplier_id" integer;--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_supplier_id_suppliers_id_fk' AND conrelid = 'public.products'::regclass) THEN
		ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
	END IF;
END $$;