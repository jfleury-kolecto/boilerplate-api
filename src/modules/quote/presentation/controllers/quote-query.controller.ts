import { Controller, HttpStatus, Inject, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import {
	GET_QUOTE_QUERY_TOKEN,
	GET_QUOTE_SUMMARY_QUERY_TOKEN,
} from "@/modules/quote/presentation/dependency-injection/quote.token";
import { QuoteOutputDto } from "@/modules/quote/presentation/dto/outputs/quote.output-dto";
import { QuoteSummaryOutputDto } from "@/modules/quote/presentation/dto/outputs/quote-summary.output-dto";
import { QUOTE_ID_PARAM, QUOTE_QUERY_API_TAG } from "@/modules/quote/presentation/quote.api";
import { ApiRoute } from "@/shared-kernel/http/presentation/decorators/api-route.decorator";
import type { GetQuoteQuery } from "@/modules/quote/application/queries/get-quote.query";
import type { GetQuoteSummaryQuery } from "@/modules/quote/application/queries/get-quote-summary.query";

@ApiTags(QUOTE_QUERY_API_TAG.name)
@Controller("quote")
export class QuoteQueryController {
	public constructor(
		@Inject(GET_QUOTE_QUERY_TOKEN)
		private readonly _getQuote: GetQuoteQuery,
		@Inject(GET_QUOTE_SUMMARY_QUERY_TOKEN)
		private readonly _getQuoteSummary: GetQuoteSummaryQuery,
	) {}

	@ApiRoute({
		description:
			"Returns the full quote: header (id, customer, currency, status), every line, and the computed total in cents.",
		errors: [{ description: "Quote not found.", status: HttpStatus.NOT_FOUND }],
		method: "GET",
		operationId: "getQuote",
		params: [QUOTE_ID_PARAM],
		path: ":id",
		response: QuoteOutputDto,
		responseDescription: "Full quote returned.",
		status: HttpStatus.OK,
		summary: "Get full quote by id",
	})
	public async getQuoteById(@Param("id") id: string): Promise<QuoteOutputDto> {
		return await this._getQuote.execute(id);
	}

	@ApiRoute({
		description:
			"Compact projection for list views: `id`, `customerId`, `status`, `currency`, and the total in cents. Lines are **not** included — the total is aggregated in SQL so this endpoint avoids loading per-line rows.",
		errors: [{ description: "Quote not found.", status: HttpStatus.NOT_FOUND }],
		method: "GET",
		operationId: "getQuoteSummary",
		params: [QUOTE_ID_PARAM],
		path: ":id/summary",
		response: QuoteSummaryOutputDto,
		responseDescription: "Quote summary returned.",
		status: HttpStatus.OK,
		summary: "Get quote summary by id",
	})
	public async getQuoteSummaryById(@Param("id") id: string): Promise<QuoteSummaryOutputDto> {
		return await this._getQuoteSummary.execute(id);
	}
}
