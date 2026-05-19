CREATE TABLE "outbox" (
	"abandoned_at" timestamp with time zone,
	"aggregate_id" varchar(64) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"correlation_id" varchar(36),
	"event_name" varchar(128) NOT NULL,
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"last_error" text,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quote_line" (
	"description" text NOT NULL,
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"quantity" integer NOT NULL,
	"quote_id" varchar(36) NOT NULL,
	"unit_price_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote" (
	"currency" varchar(3) NOT NULL,
	"customer_id" varchar(36) NOT NULL,
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quote_line" ADD CONSTRAINT "quote_line_quote_id_quote_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quote"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outbox_due_idx" ON "outbox" USING btree ("next_attempt_at","occurred_at") WHERE processed_at IS NULL AND abandoned_at IS NULL;--> statement-breakpoint
CREATE INDEX "outbox_abandoned_idx" ON "outbox" USING btree ("abandoned_at") WHERE abandoned_at IS NOT NULL;--> statement-breakpoint
CREATE INDEX "outbox_correlation_idx" ON "outbox" USING btree ("correlation_id") WHERE correlation_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "quote_line_quote_idx" ON "quote_line" USING btree ("quote_id");