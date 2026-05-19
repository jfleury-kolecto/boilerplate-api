export interface IOutboxMessage {
	id: string;
	aggregateId: string;
	correlationId: string | null;
	eventName: string;
	occurredAt: Date;
	payload: unknown;
}

export abstract class EventPublisherService {
	public abstract publishBatch(messages: IOutboxMessage[]): Promise<void>;
}
