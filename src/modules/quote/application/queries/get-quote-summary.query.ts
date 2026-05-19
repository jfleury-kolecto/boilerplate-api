import { RessourceNotFoundApplicationError } from "@/shared-kernel/errors/domain/application.error";
import type { IQuoteSummaryView } from "@/modules/quote/domain/queries/get-quote-summary.view";
import type { QuoteQueryRepository } from "@/modules/quote/domain/repositories/quote-query.repository";

export class GetQuoteSummaryQuery {
	public constructor(private readonly _repository: QuoteQueryRepository) {}

	public async execute(rawId: string): Promise<IQuoteSummaryView> {
		const view = await this._repository.findSummaryById(rawId);

		if (!view) {
			throw new RessourceNotFoundApplicationError(`Quote ${rawId} not found`);
		}

		return view;
	}
}
