import { ConfigService } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import type { Provider } from "@nestjs/common";

import { DRIZZLE_SERVICE_TOKEN } from "@/shared-kernel/database/presentation/dependency-injection/database.token";
import { WORKER_HEALTH_REGISTRY_SERVICE_TOKEN } from "@/shared-kernel/observability/presentation/dependency-injection/observability.token";
import { EventBridgePublisherService } from "@/shared-kernel/outbox/infrastructure/services/event-bridge-publisher.service";
import { OutboxRelayService } from "@/shared-kernel/outbox/infrastructure/services/outbox-relay.service";
import {
	EVENT_PUBLISHER_SERVICE_TOKEN,
	OUTBOX_RELAY_SERVICE_TOKEN,
} from "@/shared-kernel/outbox/presentation/dependency-injection/outbox.token";
import type { DrizzleService } from "@/shared-kernel/database/infrastructure/services/drizzle.service";
import type { WorkerHealthRegistryService } from "@/shared-kernel/observability/domain/services/worker-health-registry.service";
import type { EventPublisherService } from "@/shared-kernel/outbox/domain/services/event-publisher.service";

export const EVENT_PUBLISHER_SERVICE_PROVIDER: Provider<EventPublisherService> = {
	inject: [ConfigService],
	provide: EVENT_PUBLISHER_SERVICE_TOKEN,
	useFactory: (configService: ConfigService) => new EventBridgePublisherService(configService),
};

export const OUTBOX_RELAY_SERVICE_PROVIDER: Provider<OutboxRelayService> = {
	inject: [
		DRIZZLE_SERVICE_TOKEN,
		EVENT_PUBLISHER_SERVICE_TOKEN,
		SchedulerRegistry,
		ConfigService,
		WORKER_HEALTH_REGISTRY_SERVICE_TOKEN,
	],
	provide: OUTBOX_RELAY_SERVICE_TOKEN,
	useFactory: (
		drizzle: DrizzleService,
		publisher: EventPublisherService,
		schedulerRegistry: SchedulerRegistry,
		config: ConfigService,
		healthRegistry: WorkerHealthRegistryService,
	) => new OutboxRelayService(drizzle, publisher, schedulerRegistry, config, healthRegistry),
};
