import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { DatabaseModule } from "@/composition-root/database/database.module";
import { ObservabilityModule } from "@/composition-root/observability/observability.module";
import {
	EVENT_PUBLISHER_SERVICE_PROVIDER,
	OUTBOX_RELAY_SERVICE_PROVIDER,
} from "@/composition-root/outbox/outbox.provider";
import {
	EVENT_PUBLISHER_SERVICE_TOKEN,
	OUTBOX_RELAY_SERVICE_TOKEN,
} from "@/shared-kernel/outbox/presentation/dependency-injection/outbox.token";

@Module({
	exports: [OUTBOX_RELAY_SERVICE_TOKEN, EVENT_PUBLISHER_SERVICE_TOKEN],
	imports: [ConfigModule, DatabaseModule, ObservabilityModule],
	providers: [EVENT_PUBLISHER_SERVICE_PROVIDER, OUTBOX_RELAY_SERVICE_PROVIDER],
})
export class OutboxModule {}
