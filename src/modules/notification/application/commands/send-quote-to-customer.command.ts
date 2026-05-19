import { EmailMessage } from "@/modules/notification/domain/value-objects/email-message.vo";
import type { ISendQuoteToCustomerCommand } from "@/modules/notification/domain/commands/send-quote-to-customer.command";
import type { EmailSenderService } from "@/modules/notification/domain/services/email-sender.service";

const CENTS_PER_UNIT = 100;

export class SendQuoteToCustomerCommand {
	public constructor(private readonly _emailSender: EmailSenderService) {}

	public async execute(command: ISendQuoteToCustomerCommand): Promise<void> {
		const formattedAmount = (command.totalAmountCents / CENTS_PER_UNIT).toFixed(2);
		const message = EmailMessage.of(
			command.recipient,
			`Quote ${command.quoteId} sent`,
			`Your quote ${command.quoteId} has been sent — total ${formattedAmount} ${command.currency}.`,
		);

		await this._emailSender.send({
			body: message.body,
			subject: message.subject,
			to: message.to,
		});
	}
}
