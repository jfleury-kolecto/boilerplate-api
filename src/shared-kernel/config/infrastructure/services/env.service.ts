import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

import { EnvironmentVariablesSchema } from "@/shared-kernel/config/infrastructure/services/env-variables.schema";

export function envValidationService(
	config: Record<string, unknown>,
): EnvironmentVariablesSchema | Record<string, unknown> {
	// biome-ignore lint/complexity/useLiteralKeys: false positive
	if (config["NODE_ENV"] === "openapi") {
		return config;
	}

	const validatedConfig = plainToInstance(EnvironmentVariablesSchema, config, {
		enableImplicitConversion: true,
	});

	const errors = validateSync(validatedConfig, { skipMissingProperties: false });

	if (errors.length > 0) {
		throw new Error(errors.toString());
	}

	return validatedConfig;
}
