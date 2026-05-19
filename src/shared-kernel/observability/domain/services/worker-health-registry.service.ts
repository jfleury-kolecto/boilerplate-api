export interface IWorkerHealthSnapshot {
	healthy: boolean;
	lastTickAt: string | null;
	name: string;
	thresholdMs: number;
}

export abstract class WorkerHealthRegistryService {
	public abstract register(name: string, thresholdMs: number): void;
	public abstract markTick(name: string): void;
	public abstract getSnapshots(): IWorkerHealthSnapshot[];
	public abstract isHealthy(): boolean;
}
