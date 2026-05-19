# Unit of Work

## What

Une `UnitOfWorkService` **par bounded context** (`<Context>UnitOfWorkService`) wrap une transaction Postgres et expose au `callback` un `context` typé avec les `repositories` transactionnels du context (`context.<aggregate>`) et le `repository outbox` partagé (`context.outbox`). Commit si le `callback` résout, rollback s'il throw. Garantit l'atomicité "aggregate + events" pour chaque `command handler`.

Le port vit sous `modules/<context>/domain/services/<context>-unit-of-work.service.ts` — pas dans `shared/`. Pourquoi : un port shared devrait importer les `repositories` des contexts qui s'en servent (`QuoteCommandRepository`, `OrderCommandRepository`, etc.), ce qui ferait remonter les contexts dans `shared/` et casserait l'isolation. Garder la UoW per-context isole proprement chaque cluster transactionnel.

L'impl Drizzle vit sous `modules/<context>/infrastructure/services/drizzle-<context>-unit-of-work.service.ts`. Elle compose un `TransactionRunner` (slice `shared/database/`) avec les repositories du context.

## Do

- Wrapper toute mutation d'`aggregate` + enqueue d'events dans un seul `execute` :
  ```ts
  await this._unitOfWork.execute(async (context) => {
      const quote = await context.quote.findAggregateById(id);
      // ...
      await context.quote.update(quote);
      await context.outbox.enqueue(quote.pullEvents());
      return quote;
  });
  ```
- Injecter `<Context>UnitOfWorkService` (abstract class, pas impl) dans les `command handlers` via un `factory provider` sous `composition-root/<context>/`.
- Construire les `repositories` `per-tx` — la `Drizzle impl` les instancie avec le `tx client` dans le callback du `TransactionRunner`.
- `context.<aggregate>` est typé comme `<Aggregate>CommandRepository` — retourne des `aggregates`, pas des primitives.
- Un `execute` = une seule tx. Si tu as besoin de plusieurs mutations non-corrélées, ouvrir plusieurs `execute`.
- Réutiliser le `TransactionRunner` (`shared/database/infrastructure/services/transaction-runner.service.ts`) plutôt que d'appeler `drizzleService.db.transaction(...)` à la main.

## Don't

- Définir une `UnitOfWorkService` globale dans `shared/` qui agrégerait les repos de tous les contexts — ça force `shared/` à importer chaque `modules/<context>/domain/repositories/` et casse l'isolation.
- Appeler `drizzleService.db.transaction(...)` directement depuis un `handler` — passer par la UoW.
- Partager un `repository` entre plusieurs tx — chaque `execute` construit les siens.
- Injecter un `Drizzle repository` directement dans un `command handler` (`application/`) — importer `DrizzleService` depuis `application/` est interdit par dependency-cruiser.
- Retourner un VO depuis un `repository` côté query — renvoyer des primitives via `view` types.
- Imbriquer deux `execute` — Postgres supporte les nested transactions via `SAVEPOINT` mais ce n'est pas la sémantique attendue ici.
- Mélanger business logic et orchestration dans le `callback` — le `callback` ne doit que coordonner (load → call behaviour → persist → enqueue).

## Example

**Port (per-context)** — `src/modules/quote/domain/services/quote-unit-of-work.service.ts` :

```ts
export interface IQuoteUnitOfWorkContext {
    readonly outbox: OutboxRepository;
    readonly quote: QuoteCommandRepository;
}

export abstract class QuoteUnitOfWorkService {
    public abstract execute<TResult>(
        callback: (context: IQuoteUnitOfWorkContext) => Promise<TResult>,
    ): Promise<TResult>;
}
```

**Drizzle impl (per-context)** — `src/modules/quote/infrastructure/services/drizzle-quote-unit-of-work.service.ts` :

```ts
export class DrizzleQuoteUnitOfWorkService implements QuoteUnitOfWorkService {
    public constructor(
        private readonly _transactionRunner: TransactionRunner,
        private readonly _idService: IdService,
    ) {}

    public execute<TResult>(callback: (context: IQuoteUnitOfWorkContext) => Promise<TResult>): Promise<TResult> {
        return this._transactionRunner.run((tx) => {
            const context: IQuoteUnitOfWorkContext = {
                outbox: new OutboxDrizzleRepository(tx, this._idService),
                quote: new QuoteCommandDrizzleRepository(tx),
            };
            return callback(context);
        });
    }
}
```

**Wiring** — `src/composition-root/quote/quote.provider.ts` câble `QUOTE_UNIT_OF_WORK_SERVICE_TOKEN → DrizzleQuoteUnitOfWorkService` via `useFactory` qui inject `TRANSACTION_RUNNER_TOKEN` + `ID_SERVICE_TOKEN`.

**Usage dans un command handler** — `src/modules/quote/application/commands/send-quote.command.ts`.

## See also

- [`cqrs.md`](./cqrs.md) — `context.quote` est le côté command ; les queries utilisent un `repository` non-transactionnel injecté.
- [`outbox.md`](./outbox.md) — `context.outbox.enqueue(...)` dans la même tx.
- [`ddd.md`](./ddd.md) — `pullEvents()` avant `enqueue`.
- [`drizzle.md`](./drizzle.md) — typage `TDatabase | TDatabaseClient` qui permet à un repo de marcher `in-tx` comme `non-tx`.
- [`dependency-injection.md`](./dependency-injection.md) — token `<CONTEXT>_UNIT_OF_WORK_SERVICE_TOKEN` sous `presentation/dependency-injection/`.
