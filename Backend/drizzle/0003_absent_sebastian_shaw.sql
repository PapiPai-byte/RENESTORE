DO $$ BEGIN
	CREATE TYPE "public"."faq_status" AS ENUM('active', 'archived');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" integer,
	"user_message" text NOT NULL,
	"bot_reply" text,
	"matched_faq_ids" text[],
	"was_answered" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"page" text DEFAULT 'all' NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" "faq_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "marketing_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" "campaign_channel" NOT NULL,
	"date" timestamp NOT NULL,
	"spend" double precision NOT NULL,
	"revenue" double precision NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"orders" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_logs_user_id_users_id_fk' AND conrelid = 'public.chat_logs'::regclass) THEN
		ALTER TABLE "chat_logs" ADD CONSTRAINT "chat_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
	END IF;
END $$;