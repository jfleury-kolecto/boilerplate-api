import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { DRIZZLE_SERVICE_PROVIDER, TRANSACTION_RUNNER_PROVIDER } from "@/composition-root/database/database.provider";
import { UuidModule } from "@/composition-root/id/uuid.module";
import {
	DRIZZLE_SERVICE_TOKEN,
	TRANSACTION_RUNNER_TOKEN,
} from "@/shared-kernel/database/presentation/dependency-injection/database.token";

@Module({
	exports: [DRIZZLE_SERVICE_TOKEN, TRANSACTION_RUNNER_TOKEN],
	imports: [ConfigModule, UuidModule],
	providers: [DRIZZLE_SERVICE_PROVIDER, TRANSACTION_RUNNER_PROVIDER],
})
export class DatabaseModule {}
