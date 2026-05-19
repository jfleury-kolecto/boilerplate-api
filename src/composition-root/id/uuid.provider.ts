import type { Provider } from "@nestjs/common";

import { UuidService } from "@/shared-kernel/id/infrastructure/services/uuid.service";
import { ID_SERVICE_TOKEN } from "@/shared-kernel/id/presentation/dependency-injection/uuid.token";
import type { IdService } from "@/shared-kernel/id/domain/services/id.service";

export const UUID_SERVICE_PROVIDER: Provider<IdService> = {
	provide: ID_SERVICE_TOKEN,
	useClass: UuidService,
};
