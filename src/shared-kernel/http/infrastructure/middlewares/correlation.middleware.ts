import { Injectable } from "@nestjs/common";
import type { NestMiddleware } from "@nestjs/common";

// biome-ignore lint/style/useImportType: runtime value used as Nest DI token via emitDecoratorMetadata
import { CorrelationContextService } from "@/shared-kernel/correlation/domain/services/correlation-context.service";

import type { IncomingMessage, ServerResponse } from "node:http";

const HEADER_NAME = "x-correlation-id";

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
	public constructor(private readonly _correlation: CorrelationContextService) {}

	public use(req: IncomingMessage, res: ServerResponse, next: () => void): void {
		const incoming = req.headers[HEADER_NAME];
		const fromHeader = Array.isArray(incoming) ? incoming[0] : incoming;
		const correlationId =
			typeof fromHeader === "string" && fromHeader.length > 0 ? fromHeader : this._correlation.generate();

		res.setHeader(HEADER_NAME, correlationId);
		this._correlation.run(correlationId, () => {
			next();
		});
	}
}
