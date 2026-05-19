import { ConfigService } from "@nestjs/config";
import type { Provider } from "@nestjs/common";

import { CorrelationContextService } from "@/shared-kernel/correlation/domain/services/correlation-context.service";
import { InMemoryWorkerHealthRegistryService } from "@/shared-kernel/observability/infrastructure/services/in-memory-worker-health-registry.service";
import { PinoLoggerService } from "@/shared-kernel/observability/infrastructure/services/pino-logger.service";
import {
	PINO_LOGGER_SERVICE_TOKEN,
	WORKER_HEALTH_REGISTRY_SERVICE_TOKEN,
} from "@/shared-kernel/observability/presentation/dependency-injection/observability.token";
import type { WorkerHealthRegistryService } from "@/shared-kernel/observability/domain/services/worker-health-registry.service";

const SERVICE_NAME = "boilerplate-api-api";

export const WORKER_HEALTH_REGISTRY_SERVICE_PROVIDER: Provider<WorkerHealthRegistryService> = {
	provide: WORKER_HEALTH_REGISTRY_SERVICE_TOKEN,
	useFactory: () => new InMemoryWorkerHealthRegistryService(),
};

export const PINO_LOGGER_SERVICE_PROVIDER: Provider<PinoLoggerService> = {
	inject: [ConfigService, CorrelationContextService],
	provide: PINO_LOGGER_SERVICE_TOKEN,
	useFactory: (configService: ConfigService, correlation: CorrelationContextService) => {
		const env = configService.get<string>("NODE_ENV") ?? "unknown";
		const version = configService.get<string>("APP_VERSION");
		return new PinoLoggerService({
			correlation,
			env,
			pretty: env === "local",
			service: SERVICE_NAME,
			...(version !== undefined && { version }),
		});
	},
};
