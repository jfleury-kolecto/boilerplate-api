import { ValidationPipe } from "@nestjs/common";
import type { ValidationError } from "class-validator";

import { DtoValidationPresentationError } from "@/shared-kernel/errors/domain/presentation.error";

export function createValidationPipe(): ValidationPipe {
	return new ValidationPipe({
		exceptionFactory: (errors: ValidationError[]) => {
			return new DtoValidationPresentationError("DTO validation failed", {
				details: errors,
			});
		},
		forbidNonWhitelisted: true,
		forbidUnknownValues: true,
		transform: true,
		whitelist: true,
	});
}
