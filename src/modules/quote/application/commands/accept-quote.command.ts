import { RessourceNotFoundApplicationError } from "@/shared-kernel/errors/domain/application.error";
import type { Quote } from "@/modules/quote/domain/aggregates/quote.aggregate";
import type { QuoteUnitOfWorkService } from "@/modules/quote/domain/services/quote-unit-of-work.service";

export class AcceptQuoteCommand {
	public constructor(private readonly _unitOfWork: QuoteUnitOfWorkService) {}

	public async execute(rawId: string): Promise<Quote> {
		return await this._unitOfWork.execute(async (context): Promise<Quote> => {
			const quote = await context.quote.findAggregateById(rawId);

			if (!quote) {
				throw new RessourceNotFoundApplicationError(`Quote ${rawId} not found`);
			}

			quote.accept();

			await context.quote.update(quote);
			await context.outbox.enqueue(quote.pullEvents());

			return quote;
		});
	}
}
