import { ConfigService } from "@nestjs/config";
import type { Provider } from "@nestjs/common";

import { DrizzleService } from "@/shared-kernel/database/infrastructure/services/drizzle.service";
import { TransactionRunner } from "@/shared-kernel/database/infrastructure/services/transaction-runner.service";
import {
	DRIZZLE_SERVICE_TOKEN,
	TRANSACTION_RUNNER_TOKEN,
} from "@/shared-kernel/database/presentation/dependency-injection/database.token";

export const DRIZZLE_SERVICE_PROVIDER: Provider<DrizzleService> = {
	inject: [ConfigService],
	provide: DRIZZLE_SERVICE_TOKEN,
	useFactory: (configService: ConfigService) => new DrizzleService(configService),
};

export const TRANSACTION_RUNNER_PROVIDER: Provider<TransactionRunner> = {
	inject: [DRIZZLE_SERVICE_TOKEN],
	provide: TRANSACTION_RUNNER_TOKEN,
	useFactory: (drizzleService: DrizzleService) => new TransactionRunner(drizzleService),
};
