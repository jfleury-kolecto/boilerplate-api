import { eq, sql } from "drizzle-orm";

import { QuoteQueryRepository } from "@/modules/quote/domain/repositories/quote-query.repository";
import { quoteLineTable, quoteTable } from "@/shared-kernel/database/infrastructure/drizzle/schema";
import type { IQuoteView } from "@/modules/quote/domain/queries/get-quote.view";
import type { IQuoteSummaryView } from "@/modules/quote/domain/queries/get-quote-summary.view";
import type { TDatabase, TDatabaseClient } from "@/shared-kernel/database/infrastructure/services/drizzle.service";

export class QuoteQueryDrizzleRepository extends QuoteQueryRepository {
	public constructor(private readonly _db: TDatabase | TDatabaseClient) {
		super();
	}

	public async findById(id: string): Promise<IQuoteView | null> {
		const [quoteRow] = await this._db
			.select({
				currency: quoteTable.currency,
				customerId: quoteTable.customerId,
				id: quoteTable.id,
				status: quoteTable.status,
			})
			.from(quoteTable)
			.where(eq(quoteTable.id, id))
			.limit(1);

		if (!quoteRow) {
			return null;
		}

		const lineRows = await this._db
			.select({
				description: quoteLineTable.description,
				id: quoteLineTable.id,
				quantity: quoteLineTable.quantity,
				unitPriceCents: quoteLineTable.unitPriceCents,
			})
			.from(quoteLineTable)
			.where(eq(quoteLineTable.quoteId, id));

		const lines = lineRows.map((row) => ({
			...row,
			lineTotalCents: row.unitPriceCents * row.quantity,
		}));

		return {
			...quoteRow,
			lines,
			totalAmountCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
		};
	}

	public async findSummaryById(id: string): Promise<IQuoteSummaryView | null> {
		const totalAmountCentsSql =
			sql<number>`COALESCE(SUM(${quoteLineTable.unitPriceCents} * ${quoteLineTable.quantity}), 0)`
				.mapWith(Number)
				.as("total_amount_cents");

		const [row] = await this._db
			.select({
				currency: quoteTable.currency,
				customerId: quoteTable.customerId,
				id: quoteTable.id,
				status: quoteTable.status,
				totalAmountCents: totalAmountCentsSql,
			})
			.from(quoteTable)
			.leftJoin(quoteLineTable, eq(quoteLineTable.quoteId, quoteTable.id))
			.where(eq(quoteTable.id, id))
			.groupBy(quoteTable.id)
			.limit(1);

		return row ?? null;
	}
}
