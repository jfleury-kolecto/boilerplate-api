import type { DomainEvent } from "@/shared-kernel/building-blocks/domain/events/domain.event";

export abstract class OutboxRepository {
	public abstract enqueue(events: DomainEvent[]): Promise<void>;
}
