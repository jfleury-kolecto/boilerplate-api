import { Entity } from "@/shared-kernel/building-blocks/domain/entities/entity";
import type { DomainEvent } from "@/shared-kernel/building-blocks/domain/events/domain.event";
import type { ValueObject } from "@/shared-kernel/building-blocks/domain/value-objects/value-object";

export abstract class AggregateRoot<TId extends ValueObject<string>> extends Entity<TId> {
	private _pendingEvents: DomainEvent[] = [];

	protected _recordEvent(event: DomainEvent): void {
		this._pendingEvents.push(event);
	}

	public pullEvents(): DomainEvent[] {
		const events = this._pendingEvents;
		this._pendingEvents = [];
		return events;
	}
}
