import { eq } from "drizzle-orm";

import { Quote } from "@/modules/quote/domain/aggregates/quote.aggregate";
import { QuoteCommandRepository } from "@/modules/quote/domain/repositories/quote-command.repository";
import { quoteLineTable, quoteTable } from "@/shared-kernel/database/infrastructure/drizzle/schema";
import type { TDatabase, TDatabaseClient } from "@/shared-kernel/database/infrastructure/services/drizzle.service";

export class QuoteCommandDrizzleRepository extends QuoteCommandRepository {
	public constructor(private readonly _db: TDatabase | TDatabaseClient) {
		super();
	}

	public async findAggregateById(id: string): Promise<Quote | null> {
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

		return Quote.fromPrimitives({ ...quoteRow, lines: lineRows });
	}

	public async create(quote: Quote): Promise<void> {
		const primitives = quote.toPrimitives();

		await this._db.insert(quoteTable).values({
			currency: primitives.currency,
			customerId: primitives.customerId,
			id: primitives.id,
			status: primitives.status,
		});

		if (primitives.lines.length > 0) {
			await this._db.insert(quoteLineTable).values(
				primitives.lines.map((line) => ({
					description: line.description,
					id: line.id,
					quantity: line.quantity,
					quoteId: primitives.id,
					unitPriceCents: line.unitPriceCents,
				})),
			);
		}
	}

	public async update(quote: Quote): Promise<void> {
		const primitives = quote.toPrimitives();

		await this._db.update(quoteTable).set({ status: primitives.status }).where(eq(quoteTable.id, primitives.id));

		await this._db.delete(quoteLineTable).where(eq(quoteLineTable.quoteId, primitives.id));

		if (primitives.lines.length > 0) {
			await this._db.insert(quoteLineTable).values(
				primitives.lines.map((line) => ({
					description: line.description,
					id: line.id,
					quantity: line.quantity,
					quoteId: primitives.id,
					unitPriceCents: line.unitPriceCents,
				})),
			);
		}
	}
}
