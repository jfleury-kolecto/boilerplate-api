import { Catch, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import type { FastifyReply } from "fastify";

import { ApplicationError } from "@/shared-kernel/errors/domain/application.error";
import { DomainError } from "@/shared-kernel/errors/domain/domain.error";
import { InfrastructureError } from "@/shared-kernel/errors/domain/infrastructure.error";
import { PresentationError } from "@/shared-kernel/errors/domain/presentation.error";
import { errorHttpStatusByError } from "@/shared-kernel/errors/infrastructure/mappers/errors.mapper";

type THttpErrorBody = {
	message: string;
	payload: Record<string, unknown>;
};

type THttpErrorResponse = {
	status: number;
	body: THttpErrorBody;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly _logger = new Logger(HttpExceptionFilter.name);

	public catch(exception: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<FastifyReply>();

		const { status, body } = this._mapExceptionToHttpResponse(exception);

		response.status(status).send(body);
	}

	private _mapExceptionToHttpResponse(exception: unknown): THttpErrorResponse {
		if (
			exception instanceof DomainError ||
			exception instanceof ApplicationError ||
			exception instanceof InfrastructureError ||
			exception instanceof PresentationError
		) {
			const status = this._getStatusForError(exception) ?? HttpStatus.INTERNAL_SERVER_ERROR;
			const response = this._buildResponse(status, exception.message, exception.payload);
			this._logger.error(response);
			return response;
		}

		if (exception instanceof HttpException) {
			const status = exception.getStatus();
			const raw = exception.getResponse();
			const payload = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
			return this._buildResponse(status, exception.message, payload);
		}

		const response = this._buildResponse(
			HttpStatus.INTERNAL_SERVER_ERROR,
			"This error is not handled by the application",
			{},
		);

		this._logger.error(response);
		this._logger.error(exception);

		return response;
	}

	private _getStatusForError(error: Error): number | null {
		for (const [errorType, status] of errorHttpStatusByError.entries()) {
			if (error instanceof errorType) {
				return status;
			}
		}
		return null;
	}

	private _buildResponse(status: number, message: string, payload: Record<string, unknown>): THttpErrorResponse {
		return {
			body: {
				message,
				payload,
			},
			status,
		};
	}
}
