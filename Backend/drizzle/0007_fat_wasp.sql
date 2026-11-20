CREATE TABLE "data_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_key" text NOT NULL,
	"source" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "data_sources_table_key_unique" UNIQUE("table_key")
);
