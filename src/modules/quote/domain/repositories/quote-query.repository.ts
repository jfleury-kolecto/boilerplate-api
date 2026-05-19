import type { IQuoteView } from "@/modules/quote/domain/queries/get-quote.view";
import type { IQuoteSummaryView } from "@/modules/quote/domain/queries/get-quote-summary.view";

export abstract class QuoteQueryRepository {
	public abstract findById(id: string): Promise<IQuoteView | null>;
	public abstract findSummaryById(id: string): Promise<IQuoteSummaryView | null>;
}
