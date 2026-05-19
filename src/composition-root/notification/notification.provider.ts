import type { Provider } from "@nestjs/common";

import { SendQuoteToCustomerCommand } from "@/modules/notification/application/commands/send-quote-to-customer.command";
import { LoggerEmailSenderService } from "@/modules/notification/infrastructure/services/logger-email-sender.service";
import {
	EMAIL_SENDER_SERVICE_TOKEN,
	SEND_QUOTE_TO_CUSTOMER_COMMAND_TOKEN,
} from "@/modules/notification/presentation/dependency-injection/notification.token";
import type { EmailSenderService } from "@/modules/notification/domain/services/email-sender.service";

export const EMAIL_SENDER_SERVICE_PROVIDER: Provider<EmailSenderService> = {
	provide: EMAIL_SENDER_SERVICE_TOKEN,
	useFactory: () => new LoggerEmailSenderService(),
};

export const NOTIFICATION_SEND_QUOTE_TO_CUSTOMER_PROVIDER: Provider<SendQuoteToCustomerCommand> = {
	inject: [EMAIL_SENDER_SERVICE_TOKEN],
	provide: SEND_QUOTE_TO_CUSTOMER_COMMAND_TOKEN,
	useFactory: (emailSender: EmailSenderService) => new SendQuoteToCustomerCommand(emailSender),
};
