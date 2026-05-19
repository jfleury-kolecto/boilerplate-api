import { Module } from "@nestjs/common";

import { UUID_SERVICE_PROVIDER } from "@/composition-root/id/uuid.provider";
import { ID_SERVICE_TOKEN } from "@/shared-kernel/id/presentation/dependency-injection/uuid.token";

@Module({
	exports: [ID_SERVICE_TOKEN],
	providers: [UUID_SERVICE_PROVIDER],
})
export class UuidModule {}
