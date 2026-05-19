import { Injectable } from "@nestjs/common";
import Pino from "pino";
import type { LoggerService } from "@nestjs/common";
import type PinoPretty from "pino-pretty";

import type { CorrelationContextService } from "@/shared-kernel/correlation/domain/services/correlation-context.service";

interface IPinoLoggerOptions {
	correlation: CorrelationContextService;
	service: string;
	env: string;
	version?: string;
	pretty: boolean;
}

@Injectable()
export class PinoLoggerService implements LoggerService {
	private readonly _logger: Pino.BaseLogger;

	public constructor(options: IPinoLoggerOptions) {
		const correlation = options.correlation;

		const pinoPrettyOption: PinoPretty.PrettyOptions = {
			colorize: true,
			singleLine: false,
			translateTime: "SYS:HH:MM:ss.l",
		};

		this._logger = Pino({
			base: { env: options.env, service: options.service, version: options.version ?? "unknown" },
			formatters: {
				level: (label) => ({ level: label }),
			},
			messageKey: "message",
			mixin: () => {
				const correlationId = correlation.get();
				return correlationId !== undefined ? { correlationId } : {};
			},
			timestamp: Pino.stdTimeFunctions.isoTime,
			...(options.pretty && {
				transport: {
					options: pinoPrettyOption,
					target: "pino-pretty",
				},
			}),
		});
	}

	public log(message: unknown, context?: string): void {
		this._logger.info(this._formatPayload(message, context));
	}

	public error(message: unknown, stackOrContext?: string, context?: string): void {
		this._logger.error(this._formatPayload(message, context ?? stackOrContext, stackOrContext));
	}

	public warn(message: unknown, context?: string): void {
		this._logger.warn(this._formatPayload(message, context));
	}

	public debug(message: unknown, context?: string): void {
		this._logger.debug(this._formatPayload(message, context));
	}

	public verbose(message: unknown, context?: string): void {
		this._logger.trace(this._formatPayload(message, context));
	}

	public fatal(message: unknown, context?: string): void {
		this._logger.fatal(this._formatPayload(message, context));
	}

	private _formatPayload(
		message: unknown,
		context?: string,
		stack?: string,
	): Record<"context" | "stack" | "message", string | undefined> {
		const base: Record<"context" | "stack" | "message", string | undefined> = {
			context: undefined,
			message: undefined,
			stack: undefined,
		};

		const isPrimitive = typeof message === "string" || typeof message === "number" || typeof message === "boolean";
		base.message = isPrimitive ? String(message) : JSON.stringify(message);

		if (context !== undefined && context !== "") {
			base.context = context;
		}
		if (stack !== undefined && stack !== context && stack !== "") {
			base.stack = stack;
		}

		return base;
	}
}
