# CQRS

## What

Séparation physique entre `write side` et `read side` : 2 `controllers` distincts sous le même préfixe URL, 2 `repository ports` distincts sur la même table Postgres. Les `commands` manipulent l'`aggregate` via `findAggregateById`, les `queries` restent sur des primitives / `views`. Même DB, même table, mais shapes et chemins différents.

## Do

- Split `controllers` par côté — `QuoteCommandController` pour les writes, `QuoteQueryController` pour les reads. Les deux sous `@Controller("quote")`.
- 2 `repository ports` distincts :
  - `QuoteCommandRepository` (transactionnel, construit `per-tx` dans la UoW, exposé comme `context.quote`). Méthodes : `findAggregateById(id): Promise<Quote | null>`, `create(quote)`, `update(quote)`.
  - `QuoteQueryRepository` (non-transactionnel, injecté dans les `query handlers`). Méthodes : `findById(id): Promise<IQuoteView | null>`, `findSummaryById(id): Promise<IQuoteSummaryView | null>`.
- Côté command : le `Drizzle impl` appelle `Quote.fromPrimitives(...)` en interne. Le `handler` reçoit directement l'`aggregate`.
- Côté query : retourner des `views` / primitives (`IQuoteView`, `IQuoteSummaryView`). Totals agrégés en SQL (`COALESCE(SUM(...), 0)`) quand possible.
- Utiliser deux tags Scalar distincts par côté (`QUOTE_COMMAND_API_TAG`, `QUOTE_QUERY_API_TAG`) — chaque côté a sa propre description Markdown du lifecycle / des projections.
- **Event-driven subscribers (3ᵉ controller variant)** — un `bounded context` qui réagit à des events publiés par un autre context (via SQS/EventBridge) déclare un `event-controller` distinct des 2 controllers REST :
  - Fichier : `presentation/controllers/<context>-<event>.event-controller.ts` (ex : `notification-quote.event-controller.ts`).
  - Décorateur : `@MessagePattern("<event-name>")` (Nest microservice), pas `@Controller("path")` REST.
  - Le `payload` entrant est validé par un DTO sous `presentation/dto/events/<event>.event-dto.ts` avec `class-validator` (le global `ValidationPipe` s'applique aussi côté microservice).
  - Le handler délègue à un `application/commands/` handler qui consomme uniquement le port domain (`EmailSenderService`, etc.) — aucune logique métier dans l'event-controller.
  - Pas de DTO `outputs/` côté subscriber (read-side, pas de réponse HTTP). Le côté emitter publie via l'`outbox` (cf. [`outbox.md`](./outbox.md)).

## Don't

- Rehydrater l'`aggregate` côté `query handler` — les `queries` restent sur primitives, toujours.
- Exposer un VO dans une `view` (`IQuoteView` a `currency: string`, pas `currency: Currency`).
- Un `save()` générique sur un `repository` — séparer `create` et `update`, jamais d'upsert.
- Mélanger reads et writes dans un même `controller` ou `repository`.
- Typer un `IQuoteView` comme superset d'`IQuotePrimitives` et le passer à `Quote.fromPrimitives` — utiliser `findAggregateById` côté command, qui renvoie explicitement un `Quote`.

## Example

**Ports** — `src/modules/quote/domain/repositories/quote-command.repository.ts` :

```ts
export abstract class QuoteCommandRepository {
    public abstract findAggregateById(id: string): Promise<Quote | null>;
    public abstract create(quote: Quote): Promise<void>;
    public abstract update(quote: Quote): Promise<void>;
}
```

`src/modules/quote/domain/repositories/quote-query.repository.ts` :

```ts
export abstract class QuoteQueryRepository {
    public abstract findById(id: string): Promise<IQuoteView | null>;
    public abstract findSummaryById(id: string): Promise<IQuoteSummaryView | null>;
}
```

**Controllers** — `src/modules/quote/presentation/controllers/quote-command.controller.ts` (writes) et `.../quote-query.controller.ts` (reads), tous deux sous `@Controller("quote")`.

**Event subscriber** — `src/modules/notification/presentation/controllers/notification-quote.event-controller.ts` :

```ts
@Controller()
export class NotificationQuoteEventController {
    public constructor(
        @Inject(SEND_QUOTE_TO_CUSTOMER_COMMAND_TOKEN)
        private readonly _sendQuoteToCustomer: SendQuoteToCustomerCommand,
    ) {}

    @MessagePattern("quote.sent")
    public async onQuoteSent(@Payload() event: QuoteSentEventDto): Promise<void> {
        await this._sendQuoteToCustomer.execute({ /* extract from event.payload.data */ });
    }
}
```

DTO entrant : `src/modules/notification/presentation/dto/events/quote-sent.event-dto.ts`.

**Command handler** — `src/modules/quote/application/commands/send-quote.command.ts` :

```ts
return await this._unitOfWork.execute(async (context) => {
    const quote = await context.quote.findAggregateById(rawId); // Quote directement
    if (!quote) throw new RessourceNotFoundApplicationError(...);
    quote.send();
    await context.quote.update(quote);
    await context.outbox.enqueue(quote.pullEvents());
    return quote;
});
```

**Query handler** — `src/modules/quote/application/queries/get-quote.query.ts` :

```ts
const view = await this._repository.findById(rawId); // IQuoteView primitives
if (!view) throw new RessourceNotFoundApplicationError(...);
return view;
```

## See also

- [`ddd.md`](./ddd.md) — `aggregate` / `value object` / `event` / `primitives` manipulés par le côté command.
- [`unit-of-work.md`](./unit-of-work.md) — comment `context.quote` est construit `per-tx`.
- [`http-routes.md`](./http-routes.md) — 2 controllers = 2 fichiers, même tag Scalar.
