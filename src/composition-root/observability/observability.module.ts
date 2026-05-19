import { Module } from "@nestjs/common";

import { CorrelationModule } from "@/composition-root/correlation/correlation.module";
import {
	PINO_LOGGER_SERVICE_PROVIDER,
	WORKER_HEALTH_REGISTRY_SERVICE_PROVIDER,
} from "@/composition-root/observability/observability.provider";
import { HealthzController } from "@/shared-kernel/observability/presentation/controllers/healthz.controller";
import {
	PINO_LOGGER_SERVICE_TOKEN,
	WORKER_HEALTH_REGISTRY_SERVICE_TOKEN,
} from "@/shared-kernel/observability/presentation/dependency-injection/observability.token";

@Module({
	controllers: [HealthzController],
	exports: [WORKER_HEALTH_REGISTRY_SERVICE_TOKEN, PINO_LOGGER_SERVICE_TOKEN],
	imports: [CorrelationModule],
	providers: [WORKER_HEALTH_REGISTRY_SERVICE_PROVIDER, PINO_LOGGER_SERVICE_PROVIDER],
})
export class ObservabilityModule {}
