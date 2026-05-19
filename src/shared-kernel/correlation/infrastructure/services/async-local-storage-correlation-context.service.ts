import { AsyncLocalStorage } from "node:async_hooks";

import { CorrelationContextService } from "@/shared-kernel/correlation/domain/services/correlation-context.service";
import type { IdService } from "@/shared-kernel/id/domain/services/id.service";

export class AsyncLocalStorageCorrelationContextService extends CorrelationContextService {
	private readonly _storage = new AsyncLocalStorage<string>();

	public constructor(private readonly _idService: IdService) {
		super();
	}

	public override get(): string | undefined {
		return this._storage.getStore();
	}

	public override run<TResult>(correlationId: string, callback: () => TResult): TResult {
		return this._storage.run(correlationId, callback);
	}

	public override generate(): string {
		return this._idService.generateUuidV7();
	}
}
