import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import type { MiddlewareConsumer, NestModule } from "@nestjs/common";

import { CorrelationModule } from "@/composition-root/correlation/correlation.module";
import { DatabaseModule } from "@/composition-root/database/database.module";
import { NotificationModule } from "@/composition-root/notification/notification.module";
import { ObservabilityModule } from "@/composition-root/observability/observability.module";
import { OutboxModule } from "@/composition-root/outbox/outbox.module";
import { QuoteModule } from "@/composition-root/quote/quote.module";
import { envValidationService } from "@/shared-kernel/config/infrastructure/services/env.service";
import { CorrelationMiddleware } from "@/shared-kernel/http/infrastructure/middlewares/correlation.middleware";
import { RequestLoggerMiddleware } from "@/shared-kernel/http/infrastructure/middlewares/request-logger.middleware";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validate: envValidationService,
		}),
		ScheduleModule.forRoot(),

		QuoteModule,
		NotificationModule,
		DatabaseModule,
		ObservabilityModule,
		OutboxModule,
		CorrelationModule,
	],
})
export class AppModule implements NestModule {
	public configure(consumer: MiddlewareConsumer): void {
		consumer.apply(CorrelationMiddleware).forRoutes("*");
		consumer.apply(RequestLoggerMiddleware).forRoutes("*");
	}
}
