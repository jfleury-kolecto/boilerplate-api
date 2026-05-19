import { DomainEvent } from "@/shared-kernel/building-blocks/domain/events/domain.event";
import type { IEventPayload } from "@/shared-kernel/building-blocks/domain/events/domain.event";

export class QuoteCreated extends DomainEvent {
	public readonly name = "quote.created";

	public constructor(
		aggregateId: string,
		public readonly customerId: string,
		public readonly currency: string,
	) {
		super(aggregateId);
	}

	public override toPayload(): IEventPayload {
		return {
			data: {
				currency: this.currency,
				customerId: this.customerId,
			},
			version: 1,
		};
	}
}
