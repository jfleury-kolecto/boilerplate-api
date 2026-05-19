import { Logger } from "@nestjs/common";

import { EmailSenderService } from "@/modules/notification/domain/services/email-sender.service";
import type { IEmailMessage } from "@/modules/notification/domain/services/email-sender.service";

export class LoggerEmailSenderService extends EmailSenderService {
	private readonly _logger = new Logger(LoggerEmailSenderService.name);

	public async send(message: IEmailMessage): Promise<void> {
		// TODO: implement email sending
		this._logger.warn(`Stub email — to=${message.to} subject="${message.subject}"`);
		await Promise.resolve();
	}
}
