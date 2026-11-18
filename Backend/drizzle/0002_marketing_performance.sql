-- Migration: 0002_marketing_performance.sql
-- Adds marketing_performance table for budget optimization analytics.

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
