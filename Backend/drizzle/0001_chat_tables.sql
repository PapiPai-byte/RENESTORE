-- Migration: 0001_chat_tables.sql
-- Adds faqs and chat_logs tables for the AI chat feature.

DO $$ BEGIN
	CREATE TYPE "public"."faq_status" AS ENUM('active', 'archived');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

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

CREATE INDEX IF NOT EXISTS "faqs_question_idx" ON "faqs" USING gin (to_tsvector('simple', "question" || ' ' || "answer"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_logs_session_idx" ON "chat_logs" ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_logs_created_at_idx" ON "chat_logs" ("created_at" DESC);--> statement-breakpoint
