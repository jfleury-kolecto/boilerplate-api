import { Logger } from "@nestjs/common";
import { and, asc, inArray, isNull, lte, sql } from "drizzle-orm";
import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { SchedulerRegistry } from "@nestjs/schedule";

import { outboxTable } from "@/shared-kernel/database/infrastructure/drizzle/schema";
import type { DrizzleService, TDatabaseClient } from "@/shared-kernel/database/infrastructure/services/drizzle.service";
import type { WorkerHealthRegistryService } from "@/shared-kernel/observability/domain/services/worker-health-registry.service";
import type {
	EventPublisherService,
	IOutboxMessage,
} from "@/shared-kernel/outbox/domain/services/event-publisher.service";

const RELAY_INTERVAL_NAME = "outbox-relay";
const HEALTH_THRESHOLD_MULTIPLIER = 2;
const DEFAULT_INTERVAL_MS = 5_000;
const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 10;
const BACKOFF_BASE_MS = 1_000;
const BACKOFF_MAX_MS = 300_000;

interface IRelayRow {
	aggregateId: string;
	attempts: number;
	correlationId: string | null;
	eventName: string;
	id: string;
	occurredAt: Date;
	payload: unknown;
}

export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
	private readonly _logger = new Logger(OutboxRelayService.name);
	private readonly _intervalMs: number;
	private _running = false;
	private _stopping = false;

	public constructor(
		private readonly _drizzleService: DrizzleService,
		private readonly _publisher: EventPublisherService,
		private readonly _schedulerRegistry: SchedulerRegistry,
		configService: ConfigService,
		private readonly _healthRegistry: WorkerHealthRegistryService,
	) {
		this._intervalMs = Number(configService.get<string>("OUTBOX_RELAY_INTERVAL_MS") ?? DEFAULT_INTERVAL_MS);
	}

	public onModuleInit(): void {
		this._healthRegistry.register(RELAY_INTERVAL_NAME, this._intervalMs * HEALTH_THRESHOLD_MULTIPLIER);

		const interval = setInterval(() => {
			void this._tick();
		}, this._intervalMs);

		this._schedulerRegistry.addInterval(RELAY_INTERVAL_NAME, interval);
		this._logger.log(`Outbox relay scheduled (interval=${this._intervalMs}ms)`);
	}

	public onModuleDestroy(): void {
		this._stopping = true;

		if (this._schedulerRegistry.doesExist("interval", RELAY_INTERVAL_NAME)) {
			this._schedulerRegistry.deleteInterval(RELAY_INTERVAL_NAME);
		}
	}

	private async _tick(): Promise<void> {
		if (this._running || this._stopping) {
			return;
		}

		this._running = true;
		this._healthRegistry.markTick(RELAY_INTERVAL_NAME);
		try {
			await this._relayBatch();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this._logger.error(`Outbox relay tick failed: ${message}`);
		} finally {
			this._running = false;
		}
	}

	private async _relayBatch(): Promise<void> {
		await this._drizzleService.db.transaction(async (tx) => {
			const rows = await this._claimDueRows(tx);
			if (rows.length === 0) {
				return;
			}

			const messages = this._toMessages(rows);

			try {
				await this._publisher.publishBatch(messages);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				await this._applyBackoff(tx, rows, errorMessage);
				return;
			}

			const ids = rows.map((row) => row.id);
			await tx.update(outboxTable).set({ processedAt: sql`now()` }).where(inArray(outboxTable.id, ids));
			this._logger.log(`Published ${rows.length} event(s) — marked processed`);
		});
	}

	private async _claimDueRows(tx: TDatabaseClient): Promise<IRelayRow[]> {
		return await tx
			.select({
				aggregateId: outboxTable.aggregateId,
				attempts: outboxTable.attempts,
				correlationId: outboxTable.correlationId,
				eventName: outboxTable.eventName,
				id: outboxTable.id,
				occurredAt: outboxTable.occurredAt,
				payload: outboxTable.payload,
			})
			.from(outboxTable)
			.where(
				and(
					isNull(outboxTable.processedAt),
					isNull(outboxTable.abandonedAt),
					lte(outboxTable.nextAttemptAt, sql`now()`),
				),
			)
			.orderBy(asc(outboxTable.occurredAt))
			.limit(BATCH_SIZE)
			.for("update", { skipLocked: true });
	}

	private _toMessages(rows: readonly IRelayRow[]): IOutboxMessage[] {
		return rows.map((row) => ({
			aggregateId: row.aggregateId,
			correlationId: row.correlationId,
			eventName: row.eventName,
			id: row.id,
			occurredAt: row.occurredAt,
			payload: row.payload,
		}));
	}

	private async _applyBackoff(tx: TDatabaseClient, rows: readonly IRelayRow[], errorMessage: string): Promise<void> {
		const ids = rows.map((row) => row.id);
		const abandonedCount = rows.filter((row) => row.attempts + 1 >= MAX_ATTEMPTS).length;
		const retryCount = rows.length - abandonedCount;

		await tx
			.update(outboxTable)
			.set({
				abandonedAt: sql`CASE WHEN ${outboxTable.attempts} + 1 >= ${MAX_ATTEMPTS} THEN now() ELSE NULL END`,
				attempts: sql`${outboxTable.attempts} + 1`,
				lastError: errorMessage,
				nextAttemptAt: sql`now() + LEAST(pow(2, ${outboxTable.attempts} + 1) * ${BACKOFF_BASE_MS}, ${BACKOFF_MAX_MS}) * interval '1 millisecond'`,
			})
			.where(inArray(outboxTable.id, ids));

		if (retryCount > 0) {
			this._logger.warn(`Publish failed — ${retryCount} event(s) scheduled for retry: ${errorMessage}`);
		}
		if (abandonedCount > 0) {
			this._logger.error(`Abandoned ${abandonedCount} event(s) after ${MAX_ATTEMPTS} attempts: ${errorMessage}`);
		}
	}
}
