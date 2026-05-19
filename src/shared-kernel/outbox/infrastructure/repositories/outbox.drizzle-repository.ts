import { Logger } from "@nestjs/common";

import { outboxTable } from "@/shared-kernel/database/infrastructure/drizzle/schema";
import { OutboxRepository } from "@/shared-kernel/outbox/domain/repositories/outbox.repository";
import type { DomainEvent } from "@/shared-kernel/building-blocks/domain/events/domain.event";
import type { CorrelationContextService } from "@/shared-kernel/correlation/domain/services/correlation-context.service";
import type { TDatabaseClient } from "@/shared-kernel/database/infrastructure/services/drizzle.service";
import type { IdService } from "@/shared-kernel/id/domain/services/id.service";

export class OutboxDrizzleRepository extends OutboxRepository {
	private readonly _logger = new Logger(OutboxDrizzleRepository.name);

	public constructor(
		private readonly _db: TDatabaseClient,
		private readonly _idService: IdService,
		private readonly _correlation: CorrelationContextService,
	) {
		super();
	}

	public async enqueue(events: DomainEvent[]): Promise<void> {
		if (events.length === 0) {
			return;
		}

		const correlationId = this._correlation.get() ?? null;
		if (correlationId === null) {
			this._logger.warn(`enqueue called outside a correlation scope (${events.length} events)`);
		}

		await this._db.insert(outboxTable).values(
			events.map((event) => ({
				aggregateId: event.aggregateId,
				correlationId,
				eventName: event.name,
				id: this._idService.generateUuidV7(),
				occurredAt: event.occurredAt,
				payload: event.toPayload(),
			})),
		);
	}
}
