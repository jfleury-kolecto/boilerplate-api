import { DomainEvent } from "@/shared-kernel/building-blocks/domain/events/domain.event";
import type { IEventPayload } from "@/shared-kernel/building-blocks/domain/events/domain.event";

export class QuoteAccepted extends DomainEvent {
	public readonly name = "quote.accepted";

	public override toPayload(): IEventPayload {
		return { data: {}, version: 1 };
	}
}
