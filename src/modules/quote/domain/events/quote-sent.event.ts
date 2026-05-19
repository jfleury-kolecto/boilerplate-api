import { DomainEvent } from "@/shared-kernel/building-blocks/domain/events/domain.event";
import type { IEventPayload } from "@/shared-kernel/building-blocks/domain/events/domain.event";

export class QuoteSent extends DomainEvent {
	public readonly name = "quote.sent";

	public constructor(
		aggregateId: string,
		public readonly totalAmountCents: number,
		public readonly currency: string,
		public readonly recipient: string,
	) {
		super(aggregateId);
	}

	public override toPayload(): IEventPayload {
		return {
			data: {
				currency: this.currency,
				recipient: this.recipient,
				totalAmountCents: this.totalAmountCents,
			},
			version: 1,
		};
	}
}
