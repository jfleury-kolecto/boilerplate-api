import type { Quote } from "@/modules/quote/domain/aggregates/quote.aggregate";

export abstract class QuoteCommandRepository {
	public abstract findAggregateById(id: string): Promise<Quote | null>;
	public abstract create(quote: Quote): Promise<void>;
	public abstract update(quote: Quote): Promise<void>;
}
