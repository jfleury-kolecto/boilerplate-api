import { WorkerHealthRegistryService } from "@/shared-kernel/observability/domain/services/worker-health-registry.service";
import type { IWorkerHealthSnapshot } from "@/shared-kernel/observability/domain/services/worker-health-registry.service";

interface IWorkerEntry {
	lastTickAt: Date | null;
	thresholdMs: number;
}

export class InMemoryWorkerHealthRegistryService extends WorkerHealthRegistryService {
	private readonly _workers = new Map<string, IWorkerEntry>();

	public override register(name: string, thresholdMs: number): void {
		if (this._workers.has(name)) {
			throw new Error(`Worker '${name}' is already registered`);
		}
		this._workers.set(name, { lastTickAt: null, thresholdMs });
	}

	public override markTick(name: string): void {
		const worker = this._workers.get(name);
		if (worker === undefined) {
			throw new Error(`Worker '${name}' is not registered`);
		}
		worker.lastTickAt = new Date();
	}

	public override getSnapshots(): IWorkerHealthSnapshot[] {
		const now = Date.now();
		return Array.from(this._workers.entries()).map(([name, entry]) => ({
			healthy: entry.lastTickAt !== null && now - entry.lastTickAt.getTime() < entry.thresholdMs,
			lastTickAt: entry.lastTickAt === null ? null : entry.lastTickAt.toISOString(),
			name,
			thresholdMs: entry.thresholdMs,
		}));
	}

	public override isHealthy(): boolean {
		const snapshots = this.getSnapshots();
		if (snapshots.length === 0) {
			return false;
		}
		return snapshots.every((snapshot) => snapshot.healthy);
	}
}
