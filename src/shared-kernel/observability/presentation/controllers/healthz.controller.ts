import { Controller, Get, HttpStatus, Inject, ServiceUnavailableException } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse } from "@nestjs/swagger";

import { WORKER_HEALTH_REGISTRY_SERVICE_TOKEN } from "@/shared-kernel/observability/presentation/dependency-injection/observability.token";
import { HealthOutputDto } from "@/shared-kernel/observability/presentation/dto/outputs/health.output-dto";
import type { WorkerHealthRegistryService } from "@/shared-kernel/observability/domain/services/worker-health-registry.service";

@Controller()
export class HealthzController {
	public constructor(
		@Inject(WORKER_HEALTH_REGISTRY_SERVICE_TOKEN)
		private readonly _healthRegistry: WorkerHealthRegistryService,
	) {}

	@Get("/healthz")
	@ApiOperation({
		description: `
Liveness and readiness probe in a single endpoint.

### Guarantees
- The NestJS process is running and the HTTP stack responds.
- Every registered background worker has ticked within its own threshold.

### Status codes
- **200 OK** — every worker is healthy.
- **503 Service Unavailable** — at least one worker has not ticked within its threshold.

Intended for Kubernetes \`livenessProbe\` and \`readinessProbe\`.
`.trim(),
		summary: "Health check",
	})
	@ApiOkResponse({ description: "Every worker is healthy.", type: HealthOutputDto })
	@ApiServiceUnavailableResponse({ description: "At least one worker is unhealthy." })
	public health(): HealthOutputDto {
		const workers = this._healthRegistry.getSnapshots();
		const healthy = this._healthRegistry.isHealthy();

		if (!healthy) {
			throw new ServiceUnavailableException({
				healthy: false,
				statusCode: HttpStatus.SERVICE_UNAVAILABLE,
				workers,
			});
		}

		return { healthy: true, workers };
	}
}
