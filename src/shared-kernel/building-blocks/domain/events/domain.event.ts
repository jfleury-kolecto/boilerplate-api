export interface IEventPayload {
	data: Record<string, unknown>;
	version: number;
}

export abstract class DomainEvent {
	public readonly occurredAt: Date;
	public abstract readonly name: string;

	public constructor(public readonly aggregateId: string) {
		this.occurredAt = new Date();
	}

	public abstract toPayload(): IEventPayload;
}
