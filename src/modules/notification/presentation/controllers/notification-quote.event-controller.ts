import { Controller, Inject } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { SEND_QUOTE_TO_CUSTOMER_COMMAND_TOKEN } from "@/modules/notification/presentation/dependency-injection/notification.token";
// biome-ignore lint/style/useImportType: QuoteSentEventDto must stay a runtime value so the global ValidationPipe sees its class-validator decorators.
import { QuoteSentEventDto } from "@/modules/notification/presentation/dto/events/quote-sent.event-dto";
import type { SendQuoteToCustomerCommand } from "@/modules/notification/application/commands/send-quote-to-customer.command";

@Controller()
export class NotificationQuoteEventController {
	public constructor(
		@Inject(SEND_QUOTE_TO_CUSTOMER_COMMAND_TOKEN)
		private readonly _sendQuoteToCustomer: SendQuoteToCustomerCommand,
	) {}

	@MessagePattern("quote.sent")
	public async onQuoteSent(@Payload() event: QuoteSentEventDto): Promise<void> {
		await this._sendQuoteToCustomer.execute({
			currency: event.payload.data.currency,
			eventId: event.id,
			quoteId: event.aggregateId,
			recipient: event.payload.data.recipient,
			totalAmountCents: event.payload.data.totalAmountCents,
		});
	}
}
