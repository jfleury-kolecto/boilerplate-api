# Outbox pattern

## What

`Domain events` are enqueued into the `outbox` table inside the same transaction as the `aggregate` mutation. An in-process `relay` runs every `OUTBOX_RELAY_INTERVAL_MS` milliseconds (5s by default), reads due rows with `FOR UPDATE SKIP LOCKED`, publishes them to AWS EventBridge (`EventBridgePublisherService`), and marks them `processed_at`. EventBridge fans out to SQS subscribers — including the local `notification` consumer wired via `SqsServerStrategy`. `Exponential backoff` on failure, `dead letter` after `MAX_ATTEMPTS` attempts.

## Do

- Always enqueue through the UoW: `await context.outbox.enqueue(quote.pullEvents())` at the end of every `command handler`. This guarantees the "aggregate + events" atomicity: if the tx rolls back, no event is published.
- The stored `payload` is the `{ version: number, data: Record<string, unknown> }` envelope produced by `DomainEvent.toPayload()`. Metadata (`aggregate_id`, `event_name`, `occurred_at`) lives in dedicated columns on the `outbox` row.
- On publish failure (exception thrown by `publishBatch`): the `relay` bumps `attempts`, stores `last_error`, computes `next_attempt_at = now() + LEAST(2^attempts × 1s, 5min)`, and flips `abandoned_at = now()` when `attempts >= MAX_ATTEMPTS` (10). All in a single SQL `UPDATE` with `CASE/LEAST`.
- Filtered `SELECT`: `WHERE processed_at IS NULL AND abandoned_at IS NULL AND next_attempt_at <= now()`. 2 partial indexes cover this path and the DLQ (see `schema.ts`).
- A single `publisher`: `EventBridgePublisherService`. Local LocalStack via `AWS_ENDPOINT_URL_EVENTS=http://localhost:4566`, real AWS in prod (endpoint inferred by the SDK default).
- `fail-fast` at construction: `EventBridgePublisherService` throws if `EVENT_BUS_NAME` is empty — no silent fallback.
- `WorkerHealthRegistryService.markTick()` is called at the start of every `relay` tick — the `/healthz` endpoint uses it to return 503 when the relay is frozen.

## Don't

- Publish to SQS directly from a `command handler` — everything goes through `context.outbox.enqueue(...)`.
- Bypass the UoW with a manual `INSERT INTO outbox`.
- Reintroduce a `ConsolePublisher` / `DryRunAbortError` / conditional local-vs-prod path — a single path, always real.
- Store `event as unknown as Record<string, unknown>` — go through `toPayload()`, otherwise renaming an event field silently breaks consumers.
- Log every row on every tick — the noise hides real errors. Only log publish success / retry / abandon.
- Catch the `publishBatch` exception anywhere other than the `relay`'s backoff branch.

## Example

**Enqueue from a command handler** — `src/modules/quote/application/commands/send-quote.command.ts`:

```ts
return await this._unitOfWork.execute(async (context) => {
    const quote = await context.quote.findAggregateById(rawId);
    if (!quote) throw new RessourceNotFoundApplicationError(...);
    quote.send();
    await context.quote.update(quote);
    await context.outbox.enqueue(quote.pullEvents());
    return quote;
});
```

**Relay** — `src/shared-kernel/outbox/infrastructure/services/outbox-relay.service.ts` (backoff formula excerpt):

```ts
await tx.update(outboxTable).set({
    abandonedAt: sql`CASE WHEN ${outboxTable.attempts} + 1 >= ${MAX_ATTEMPTS} THEN now() ELSE NULL END`,
    attempts: sql`${outboxTable.attempts} + 1`,
    lastError: errorMessage,
    nextAttemptAt: sql`now() + LEAST(pow(2, ${outboxTable.attempts} + 1) * ${BACKOFF_BASE_MS}, ${BACKOFF_MAX_MS}) * interval '1 millisecond'`,
}).where(inArray(outboxTable.id, ids));
```

**Domain event with `toPayload`** — `src/modules/quote/domain/events/quote-sent.event.ts`:

```ts
public override toPayload(): IEventPayload<{ currency: string; totalAmountCents: number }> {
    return { data: { currency: this.currency, totalAmountCents: this.totalAmountCents }, version: 1 };
}
```

**Schema** — `src/shared-kernel/database/infrastructure/drizzle/schema.ts`: columns `abandoned_at`, `attempts`, `last_error`, `next_attempt_at`, `processed_at` + 2 partial indexes (`outbox_due_idx`, `outbox_abandoned_idx`).

## See also

- [`unit-of-work.md`](./unit-of-work.md) — how `context.outbox` is built inside the same tx as `context.quote`.
- [`ddd.md`](./ddd.md) — `toPayload()` and `domain event` versioning.
- [`drizzle.md`](./drizzle.md) — `FOR UPDATE SKIP LOCKED`, partial indexes, `sql\`...\`` for `CASE/LEAST`.
- [`observability.md`](./observability.md) — `WorkerHealthRegistryService`, `/healthz`.
