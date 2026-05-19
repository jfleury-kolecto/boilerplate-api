import { Quote } from "@/modules/quote/domain/aggregates/quote.aggregate";
import type { QuoteUnitOfWorkService } from "@/modules/quote/domain/services/quote-unit-of-work.service";
import type { IdService } from "@/shared-kernel/id/domain/services/id.service";

interface ICreateQuoteCommandInput {
	customerId: string;
	currency: string;
	lines: { description: string; quantity: number; unitPriceCents: number }[];
}

export class CreateQuoteCommand {
	public constructor(
		private readonly _idService: IdService,
		private readonly _unitOfWork: QuoteUnitOfWorkService,
	) {}

	public async execute(input: ICreateQuoteCommandInput): Promise<Quote> {
		return await this._unitOfWork.execute(async (context): Promise<Quote> => {
			const quote = Quote.create({
				currency: input.currency,
				customerId: input.customerId,
				id: this._idService.generateUuidV7(),
				lines: input.lines.map((line) => ({
					description: line.description,
					id: this._idService.generateUuidV7(),
					quantity: line.quantity,
					unitPriceCents: line.unitPriceCents,
				})),
			});

			await context.quote.create(quote);
			await context.outbox.enqueue(quote.pullEvents());

			return quote;
		});
	}
}
