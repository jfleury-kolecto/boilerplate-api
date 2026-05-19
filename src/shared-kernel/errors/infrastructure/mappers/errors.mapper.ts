import { HttpStatus } from "@nestjs/common";

import {
	RessourceAlreadyExistsApplicationError,
	RessourceNotFoundApplicationError,
} from "@/shared-kernel/errors/domain/application.error";
import { InvalidTransitionDomainError, ValidationDomainError } from "@/shared-kernel/errors/domain/domain.error";
import { ValidationInfrastructureError } from "@/shared-kernel/errors/domain/infrastructure.error";
import {
	DtoValidationPresentationError,
	ForbiddenPresentationError,
	UnauthorizedPresentationError,
} from "@/shared-kernel/errors/domain/presentation.error";

type TErrorConstructor = abstract new (message: string, payload?: Record<string, unknown>) => Error;

const errorHttpStatusByDomainError: Map<TErrorConstructor, HttpStatus> = new Map([
	[ValidationDomainError, HttpStatus.BAD_REQUEST],
	[InvalidTransitionDomainError, HttpStatus.CONFLICT],
]);

const errorHttpStatusByApplicationError: Map<TErrorConstructor, HttpStatus> = new Map([
	[RessourceNotFoundApplicationError, HttpStatus.NOT_FOUND],
	[RessourceAlreadyExistsApplicationError, HttpStatus.CONFLICT],
]);

const errorHttpStatusByInfrastructureError: Map<TErrorConstructor, HttpStatus> = new Map([
	[ValidationInfrastructureError, HttpStatus.INTERNAL_SERVER_ERROR],
]);

const errorHttpStatusByPresentationError: Map<TErrorConstructor, HttpStatus> = new Map([
	[DtoValidationPresentationError, HttpStatus.BAD_REQUEST],
	[UnauthorizedPresentationError, HttpStatus.UNAUTHORIZED],
	[ForbiddenPresentationError, HttpStatus.FORBIDDEN],
]);

export const errorHttpStatusByError: Map<TErrorConstructor, HttpStatus> = new Map([
	...errorHttpStatusByDomainError.entries(),
	...errorHttpStatusByApplicationError.entries(),
	...errorHttpStatusByInfrastructureError.entries(),
	...errorHttpStatusByPresentationError.entries(),
]);
