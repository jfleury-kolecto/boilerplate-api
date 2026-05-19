import { Module } from "@nestjs/common";

import {
	EMAIL_SENDER_SERVICE_PROVIDER,
	NOTIFICATION_SEND_QUOTE_TO_CUSTOMER_PROVIDER,
} from "@/composition-root/notification/notification.provider";
import { NotificationQuoteEventController } from "@/modules/notification/presentation/controllers/notification-quote.event-controller";

@Module({
	controllers: [NotificationQuoteEventController],
	exports: [],
	imports: [],
	providers: [EMAIL_SENDER_SERVICE_PROVIDER, NOTIFICATION_SEND_QUOTE_TO_CUSTOMER_PROVIDER],
})
export class NotificationModule {}
