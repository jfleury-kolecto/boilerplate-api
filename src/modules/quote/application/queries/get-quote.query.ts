import { RessourceNotFoundApplicationError } from "@/shared-kernel/errors/domain/application.error";
import type { IQuoteView } from "@/modules/quote/domain/queries/get-quote.view";
import type { QuoteQueryRepository } from "@/modules/quote/domain/repositories/quote-query.repository";

export class GetQuoteQuery {
	public constructor(private readonly _repository: QuoteQueryRepository) {}

	public async execute(rawId: string): Promise<IQuoteView> {
		const view = await this._repository.findById(rawId);

		if (!view) {
			throw new RessourceNotFoundApplicationError(`Quote ${rawId} not found`);
		}

		return view;
	}
}
