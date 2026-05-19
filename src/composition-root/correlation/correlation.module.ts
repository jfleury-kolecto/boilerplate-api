import { Module } from "@nestjs/common";

import { CORRELATION_CONTEXT_SERVICE_PROVIDER } from "@/composition-root/correlation/correlation.provider";
import { UuidModule } from "@/composition-root/id/uuid.module";
import { CorrelationContextService } from "@/shared-kernel/correlation/domain/services/correlation-context.service";

@Module({
	exports: [CorrelationContextService],
	imports: [UuidModule],
	providers: [CORRELATION_CONTEXT_SERVICE_PROVIDER],
})
export class CorrelationModule {}
