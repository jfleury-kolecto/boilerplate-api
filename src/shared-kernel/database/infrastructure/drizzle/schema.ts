import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const quoteTable = pgTable("quote", {
	currency: varchar("currency", { length: 3 }).notNull(),
	customerId: varchar("customer_id", { length: 36 }).notNull(),
	id: varchar("id", { length: 36 }).primaryKey(),
	status: text("status").notNull(),
});

export const quoteLineTable = pgTable(
	"quote_line",
	{
		description: text("description").notNull(),
		id: varchar("id", { length: 36 }).primaryKey(),
		quantity: integer("quantity").notNull(),
		quoteId: varchar("quote_id", { length: 36 })
			.notNull()
			.references(() => quoteTable.id, { onDelete: "cascade" }),
		unitPriceCents: integer("unit_price_cents").notNull(),
	},
	(table) => [index("quote_line_quote_idx").on(table.quoteId)],
);

export const outboxTable = pgTable(
	"outbox",
	{
		abandonedAt: timestamp("abandoned_at", { withTimezone: true }),
		aggregateId: varchar("aggregate_id", { length: 64 }).notNull(),
		attempts: integer("attempts").notNull().default(0),
		correlationId: varchar("correlation_id", { length: 36 }),
		eventName: varchar("event_name", { length: 128 }).notNull(),
		id: varchar("id", { length: 36 }).primaryKey(),
		lastError: text("last_error"),
		nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
		occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
		payload: jsonb("payload").notNull(),
		processedAt: timestamp("processed_at", { withTimezone: true }),
	},
	(table) => [
		index("outbox_due_idx")
			.on(table.nextAttemptAt, table.occurredAt)
			.where(sql`processed_at IS NULL AND abandoned_at IS NULL`),
		index("outbox_abandoned_idx").on(table.abandonedAt).where(sql`abandoned_at IS NOT NULL`),
		index("outbox_correlation_idx").on(table.correlationId).where(sql`correlation_id IS NOT NULL`),
	],
);
