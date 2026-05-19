import { Injectable, Logger } from "@nestjs/common";
import type { NestMiddleware } from "@nestjs/common";

// biome-ignore lint/style/useImportType: runtime value used as Nest DI token via emitDecoratorMetadata
import { CorrelationContextService } from "@/shared-kernel/correlation/domain/services/correlation-context.service";

import type { IncomingMessage, ServerResponse } from "node:http";

const NS_PER_MS = 1_000_000;
const STATUS_CLIENT_ERROR = 400;
const STATUS_SERVER_ERROR = 500;

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
	private readonly _logger = new Logger(RequestLoggerMiddleware.name);

	public constructor(private readonly _correlation: CorrelationContextService) {}

	public use(req: IncomingMessage, res: ServerResponse, next: () => void): void {
		const startedAt = process.hrtime.bigint();
		const method = req.method ?? "?";
		const url = req.url ?? "?";

		res.on("finish", () => {
			const durationMs = Number(process.hrtime.bigint() - startedAt) / NS_PER_MS;
			const correlationId = this._correlation.get() ?? "-";
			const line = `${method} ${url} ${res.statusCode} - ${durationMs.toFixed(1)}ms cid=${correlationId}`;

			if (res.statusCode >= STATUS_SERVER_ERROR) {
				this._logger.error(line);
			} else if (res.statusCode >= STATUS_CLIENT_ERROR) {
				this._logger.warn(line);
			} else {
				this._logger.log(line);
			}
		});

		next();
	}
}
