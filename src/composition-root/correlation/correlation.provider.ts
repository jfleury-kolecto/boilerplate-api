import type { Provider } from "@nestjs/common";

import { CorrelationContextService } from "@/shared-kernel/correlation/domain/services/correlation-context.service";
import { AsyncLocalStorageCorrelationContextService } from "@/shared-kernel/correlation/infrastructure/services/async-local-storage-correlation-context.service";
import { ID_SERVICE_TOKEN } from "@/shared-kernel/id/presentation/dependency-injection/uuid.token";
import type { IdService } from "@/shared-kernel/id/domain/services/id.service";

export const CORRELATION_CONTEXT_SERVICE_PROVIDER: Provider<CorrelationContextService> = {
	inject: [ID_SERVICE_TOKEN],
	provide: CorrelationContextService,
	useFactory: (idService: IdService) => new AsyncLocalStorageCorrelationContextService(idService),
};
