# DDD — building blocks

## What

Les briques DDD du repo : `value object`, `entity`, `aggregate root`, `domain event`, `domain service`, `domain error`. Toutes sont pures — aucune dépendance à NestJS, Drizzle, `process.env`, ni au réseau. Le `bounded context` de référence est `src/modules/quote/`. Les classes de base vivent dans `src/shared-kernel/building-blocks/domain/`.

## Do

### Value object

- Extend `ValueObject<T>` (cf. `src/shared-kernel/building-blocks/domain/value-objects/value-object.ts`).
- `private constructor` — instantiation uniquement via `static factory method` (`of`, `fromString`, `eur()`, …).
- Immutable : tous les champs `readonly`, toute mutation retourne une nouvelle instance.
- Le `factory` valide l'input et throw `ValidationDomainError` si invalide.
- `equals()` hérité — égalité par valeur.

### Entity

- Extend `Entity<TId>` (identité par `id`, pas par valeur).
- Appartient à un `aggregate` — jamais persistée seule.
- `fromPrimitives(primitives)` pour rehydrater, `toPrimitives()` pour sérialiser.

### Aggregate root

- Extend `AggregateRoot<TId>`. Seul point d'entrée pour muter son cluster (entities enfants, collections).
- `private constructor` + `static create(command): Aggregate` qui valide les `invariants` puis appelle `_recordEvent(...)`.
- `static fromPrimitives(primitives): Aggregate` pour rehydrater (aucun event émis).
- `toPrimitives(): IXxxPrimitives` pour persister.
- Chaque `public behaviour` : check invariants → mutate state → `_recordEvent(...)`.
- `pullEvents()` (hérité) — retourne et vide les events accumulés. Appelé par le `command handler` application.

### Domain event

- Extend `DomainEvent` (abstract class, pas interface). Cf. `src/shared-kernel/building-blocks/domain/events/domain.event.ts`.
- Nommage au passé, sans suffixe `Event` : `QuoteCreated`, `QuoteSent`, `QuoteAccepted` — pas `QuoteCreatedEvent`.
- `public readonly name = "quote.created"` (snake_case avec prefix du `bounded context`).
- `constructor` appelle `super(aggregateId)` pour hériter `occurredAt`.
- `public override toPayload(): IEventPayload<TData>` — l'enveloppe stockée par l'`outbox` : `{ version: number, data: Record<string, unknown> }`.
- `IEventPayload<TData>` est générique avec un default `Record<string, unknown>` ; chaque event override avec son shape spécifique.

### Domain service

- Classe stateless avec `static method`. Cas d'usage : règle qui traverse plusieurs VOs / aggregates sans appartenir naturellement à aucun.
- Si la règle a besoin d'I/O plus tard (lookup DB, clock), la promouvoir en `abstract class` (port) avec impl côté `infrastructure/`.

### Domain errors

- Uniquement les classes de `src/shared-kernel/errors/domain/domain.error.ts` : `ValidationDomainError` (400) et `InvalidTransitionDomainError` (409).
- Payload = contexte structuré (ids, valeurs reçues, limites). Pas de concat dans le `message`.

## Don't

- `anemic model` — aggregate avec seulement des `getters/setters` et la logique ailleurs.
- `public setters` sur VO, Entity ou Aggregate.
- `new Date()` ou `Math.random()` dans le domain — wrap via un `port` si nécessaire (cf. `IdService` pour `UuidV7`).
- Importer `@nestjs/*`, `drizzle-orm`, `process.env` depuis `domain/`.
- Catcher les erreurs techniques dans le domain — laisser propager.
- Dupliquer la validation : une fois dans le VO suffit.
- Muter une collection exposée via un `getter` (retourner `readonly`).
- Events mutables ou construits sans `super(aggregateId)`.

## Example

**Aggregate** — `src/modules/quote/domain/aggregates/quote.aggregate.ts`

```ts
export class Quote extends AggregateRoot<string> {
    private constructor(/* ... */) { super(id); }

    public static create(command: ICreateQuoteCommand): Quote {
        // valide les invariants, construit les VOs, _recordEvent(new QuoteCreated(...))
    }

    public static fromPrimitives(primitives: IQuotePrimitives): Quote { /* ... */ }

    public addLine(command: IAddQuoteLineCommand): void {
        if (!this._status.isDraft()) throw new InvalidTransitionDomainError(...);
        // mutate + _recordEvent(new QuoteLineAdded(...))
    }
}
```

**Value object** — `src/modules/quote/domain/value-objects/money.vo.ts`, `currency.vo.ts`, `quantity.vo.ts`, `quote-status.vo.ts`.

**Entity** — `src/modules/quote/domain/entities/quote-line.entity.ts`.

**Domain event** — `src/modules/quote/domain/events/quote-sent.event.ts` :

```ts
export class QuoteSent extends DomainEvent {
    public readonly name = "quote.sent";

    public constructor(aggregateId: string, public readonly totalAmountCents: number, public readonly currency: string) {
        super(aggregateId);
    }

    public override toPayload(): IEventPayload<{ currency: string; totalAmountCents: number }> {
        return { data: { currency: this.currency, totalAmountCents: this.totalAmountCents }, version: 1 };
    }
}
```

## See also

- [`cqrs.md`](./cqrs.md) — comment les `aggregates` sont rehydratés côté `command` vs. les primitives côté `query`.
- [`unit-of-work.md`](./unit-of-work.md) — persistance transactionnelle + enqueue d'events dans la même tx.
- [`outbox.md`](./outbox.md) — ce que devient un event après `pullEvents()`.
- [`error-handling.md`](./error-handling.md) — mapping des `domain errors` vers HTTP.
