# Drizzle

## What

Drizzle ORM sur Postgres 17. `schema` typé TypeScript dans `src/shared-kernel/database/infrastructure/drizzle/schema.ts`, migrations versionnées générées dans `drizzle/`. Un `repository Drizzle` accepte `TDatabase | TDatabaseClient` pour pouvoir tourner `in-tx` comme `non-tx`. Concurrence outbox gérée via `FOR UPDATE SKIP LOCKED`.

## Do

- Toujours lister les colonnes dans un `select` :
  ```ts
  await db.select({ id: t.id, status: t.status }).from(t).where(eq(t.id, id));
  ```
- Schéma : 1 `pgTable(...)` par table, SQL `snake_case` (`quote_line`, `outbox`), TypeScript identifiers `camelCase` (`quoteLineTable`, `outboxTable`), columns TS `camelCase` → SQL `snake_case` (`customerId: varchar("customer_id", ...)`).
- Indexes : `index("<table>_<purpose>_idx").on(...)`. Index partiels (`.where(sql\`...\``)`) pour filtrer les rows "chaudes" (outbox due / abandoned).
- Migrations : `pnpm db:generate` produit un `.sql` + snapshot. `pnpm db:migrate` les applique. `pnpm db:push` uniquement en dev pour prototyper vite.
- `TDatabase | TDatabaseClient` dans les repos (cf. `src/shared-kernel/database/infrastructure/services/drizzle.service.ts`) — le même repo marche instancié avec `drizzleService.db` (non-tx) ou avec le `tx` d'un callback (in-tx).
- Transactions via `UnitOfWorkService.execute(cb)` — jamais `db.transaction(...)` direct dans un `handler`. Exception : le `outbox relay` qui est infra de bas niveau.
- Concurrence : `FOR UPDATE SKIP LOCKED` pour la lecture d'une queue. Exemple : `OutboxRelayService._claimDueRows` avec `.for("update", { skipLocked: true })`.
- SQL literals via `sql\`...\`` pour ce que Drizzle ne sait pas exprimer (`COALESCE(...)`, `CASE WHEN ... THEN ...`, `LEAST(...)`). Typer via `sql<number>\`...\`.mapWith(Number)`.
- `INSERT` / `UPDATE` / `DELETE` : lister explicitement les colonnes touchées, jamais toutes. `UPDATE` ne touche que les colonnes **mutables** (status, pas currency).
- `jsonb` : typer `Record<string, unknown>` côté TS, pas `any`.
- Rename : hand-edit la migration générée (drizzle-kit génère DROP + CREATE par défaut sur un rename, ce qui perd les données).

## Don't

- `.select()` nu — c'est l'équivalent de `SELECT *`, charge toutes les colonnes pour rien.
- `onConflictDoUpdate` — c'est un upsert déguisé. Préférer `create` explicite (throw si conflict) ou `update` explicite (throw si 0 rows affected).
- `db.transaction(...)` directement dans un `handler` application — la UoW est là pour ça.
- Hand-edit d'une migration existante — régénérer si possible, sauf pour un rename.
- `UPDATE` qui touche les colonnes immutables (id, currency, customer_id) — les colonnes immuables ne devraient pas apparaître dans `.set({...})`.
- `any` dans les types Drizzle — utiliser `InferSelectModel`, `InferInsertModel` si nécessaire.
- `SET NULL` sur une FK required — préférer `CASCADE` ou `RESTRICT`.
- Partager un `repository Drizzle` entre plusieurs transactions.

## Example

**Schema** — `src/shared-kernel/database/infrastructure/drizzle/schema.ts` :

```ts
export const outboxTable = pgTable(
    "outbox",
    {
        abandonedAt: timestamp("abandoned_at", { withTimezone: true }),
        attempts: integer("attempts").notNull().default(0),
        // ...
        processedAt: timestamp("processed_at", { withTimezone: true }),
    },
    (table) => [
        index("outbox_due_idx")
            .on(table.nextAttemptAt, table.occurredAt)
            .where(sql`processed_at IS NULL AND abandoned_at IS NULL`),
        index("outbox_abandoned_idx").on(table.abandonedAt).where(sql`abandoned_at IS NOT NULL`),
    ],
);
```

**Surgical SELECT** — `src/modules/quote/infrastructure/repositories/quote-query.drizzle-repository.ts` :

```ts
const [quoteRow] = await this._db
    .select({
        currency: quoteTable.currency,
        customerId: quoteTable.customerId,
        id: quoteTable.id,
        status: quoteTable.status,
    })
    .from(quoteTable)
    .where(eq(quoteTable.id, id))
    .limit(1);
```

**SQL literal** — résumé agrégé :

```ts
const totalAmountCentsSql = sql<number>`COALESCE(SUM(${quoteLineTable.unitPriceCents} * ${quoteLineTable.quantity}), 0)`
    .mapWith(Number)
    .as("total_amount_cents");
```

**SKIP LOCKED** — `src/shared-kernel/outbox/infrastructure/services/outbox-relay.service.ts` :

```ts
await tx
    .select({/* ... */})
    .from(outboxTable)
    .where(and(isNull(outboxTable.processedAt), isNull(outboxTable.abandonedAt), lte(outboxTable.nextAttemptAt, sql`now()`)))
    .orderBy(asc(outboxTable.occurredAt))
    .limit(BATCH_SIZE)
    .for("update", { skipLocked: true });
```

**Mutable UPDATE** — `src/modules/quote/infrastructure/repositories/quote-command.drizzle-repository.ts` ne `.set` que `status`, jamais `id`/`customerId`/`currency`.

## See also

- [`unit-of-work.md`](./unit-of-work.md) — `TDatabase | TDatabaseClient` passé aux repos.
- [`outbox.md`](./outbox.md) — `FOR UPDATE SKIP LOCKED` + index partiels.
- [`cqrs.md`](./cqrs.md) — 2 repos Drizzle, même table, shapes différentes.
- `biome.json` — sort keys, imports, etc. appliqués sur `schema.ts`.
- `drizzle.config.ts` — le seul endroit avec `process.env` toléré (hors Nest).
