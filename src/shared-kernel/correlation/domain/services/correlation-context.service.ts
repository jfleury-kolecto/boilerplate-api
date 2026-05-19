export abstract class CorrelationContextService {
	public abstract get(): string | undefined;
	public abstract run<TResult>(correlationId: string, callback: () => TResult): TResult;
	public abstract generate(): string;
}
