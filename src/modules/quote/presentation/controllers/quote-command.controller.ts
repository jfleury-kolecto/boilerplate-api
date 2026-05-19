import { Body, Controller, HttpStatus, Inject, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import {
	ACCEPT_QUOTE_COMMAND_TOKEN,
	CREATE_QUOTE_COMMAND_TOKEN,
	REJECT_QUOTE_COMMAND_TOKEN,
	SEND_QUOTE_COMMAND_TOKEN,
} from "@/modules/quote/presentation/dependency-injection/quote.token";
import { CreateQuoteInputDto } from "@/modules/quote/presentation/dto/inputs/create-quote.input-dto";
import { SendQuoteInputDto } from "@/modules/quote/presentation/dto/inputs/send-quote.input-dto";
import { QuoteOutputDto } from "@/modules/quote/presentation/dto/outputs/quote.output-dto";
import { QuoteOutputDtoMappers } from "@/modules/quote/presentation/mappers/quote-output-dto.mappers";
import { QUOTE_COMMAND_API_TAG, QUOTE_ID_PARAM } from "@/modules/quote/presentation/quote.api";
import { ApiRoute } from "@/shared-kernel/http/presentation/decorators/api-route.decorator";
import type { AcceptQuoteCommand } from "@/modules/quote/application/commands/accept-quote.command";
import type { CreateQuoteCommand } from "@/modules/quote/application/commands/create-quote.command";
import type { RejectQuoteCommand } from "@/modules/quote/application/commands/reject-quote.command";
import type { SendQuoteCommand } from "@/modules/quote/application/commands/send-quote.command";

@ApiTags(QUOTE_COMMAND_API_TAG.name)
@Controller("quote")
export class QuoteCommandController {
	public constructor(
		@Inject(CREATE_QUOTE_COMMAND_TOKEN)
		private readonly _createQuote: CreateQuoteCommand,
		@Inject(SEND_QUOTE_COMMAND_TOKEN)
		private readonly _sendQuote: SendQuoteCommand,
		@Inject(ACCEPT_QUOTE_COMMAND_TOKEN)
		private readonly _acceptQuote: AcceptQuoteCommand,
		@Inject(REJECT_QUOTE_COMMAND_TOKEN)
		private readonly _rejectQuote: RejectQuoteCommand,
	) {}

	@ApiRoute({
		body: CreateQuoteInputDto,
		description:
			"Creates a quote in `draft` status. The body must carry at least one line; lines are immutable for the rest of the quote lifecycle.",
		errors: [{ description: "Body validation failed (see error payload).", status: HttpStatus.BAD_REQUEST }],
		method: "POST",
		operationId: "createQuote",
		response: QuoteOutputDto,
		responseDescription: "Quote stored in draft and ready to be sent.",
		status: HttpStatus.CREATED,
		summary: "Create draft quote with lines",
	})
	public async createQuote(@Body() body: CreateQuoteInputDto): Promise<QuoteOutputDto> {
		const quote = await this._createQuote.execute({
			currency: body.currency,
			customerId: body.customerId,
			lines: body.lines.map((line) => ({
				description: line.description,
				quantity: line.quantity,
				unitPriceCents: line.unitPriceCents,
			})),
		});
		return QuoteOutputDtoMappers.fromAggregate(quote);
	}

	@ApiRoute({
		body: SendQuoteInputDto,
		description: [
			"Transitions the quote from `draft` to `sent` and queues an email notification for the given recipient.",
			"",
			"The email itself is dispatched asynchronously via the outbox + EventBridge → SQS pipeline; this endpoint returns as soon as the state transition is committed and the event is enqueued. Delivery is eventual.",
			"",
			"Once sent, the quote is frozen and the customer can `accept` or `reject` it.",
		].join("\n"),
		errors: [
			{ description: "Body validation failed (see error payload).", status: HttpStatus.BAD_REQUEST },
			{ description: "Quote not found.", status: HttpStatus.NOT_FOUND },
			{ description: "Quote is not in draft status.", status: HttpStatus.CONFLICT },
		],
		method: "POST",
		operationId: "sendQuote",
		params: [QUOTE_ID_PARAM],
		path: ":id/send",
		response: QuoteOutputDto,
		responseDescription: "Quote frozen and notification dispatch queued.",
		status: HttpStatus.OK,
		summary: "Send draft quote to a recipient",
	})
	public async sendQuote(@Param("id") id: string, @Body() body: SendQuoteInputDto): Promise<QuoteOutputDto> {
		const quote = await this._sendQuote.execute(id, body.recipient);
		return QuoteOutputDtoMappers.fromAggregate(quote);
	}

	@ApiRoute({
		description:
			"Marks a `sent` quote as `accepted` on behalf of the customer. Terminal state — the quote can no longer transition.",
		errors: [
			{ description: "Quote not found.", status: HttpStatus.NOT_FOUND },
			{ description: "Quote is not in sent status.", status: HttpStatus.CONFLICT },
		],
		method: "POST",
		operationId: "acceptQuote",
		params: [QUOTE_ID_PARAM],
		path: ":id/accept",
		response: QuoteOutputDto,
		responseDescription: "Quote accepted (terminal state).",
		status: HttpStatus.OK,
		summary: "Accept sent quote",
	})
	public async acceptQuote(@Param("id") id: string): Promise<QuoteOutputDto> {
		const quote = await this._acceptQuote.execute(id);
		return QuoteOutputDtoMappers.fromAggregate(quote);
	}

	@ApiRoute({
		description:
			"Marks a `sent` quote as `rejected` on behalf of the customer. Terminal state — the quote can no longer transition.",
		errors: [
			{ description: "Quote not found.", status: HttpStatus.NOT_FOUND },
			{ description: "Quote is not in sent status.", status: HttpStatus.CONFLICT },
		],
		method: "POST",
		operationId: "rejectQuote",
		params: [QUOTE_ID_PARAM],
		path: ":id/reject",
		response: QuoteOutputDto,
		responseDescription: "Quote rejected (terminal state).",
		status: HttpStatus.OK,
		summary: "Reject sent quote",
	})
	public async rejectQuote(@Param("id") id: string): Promise<QuoteOutputDto> {
		const quote = await this._rejectQuote.execute(id);
		return QuoteOutputDtoMappers.fromAggregate(quote);
	}
}
