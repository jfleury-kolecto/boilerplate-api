# Testing

## What

Stack : Vitest. Tests colocalisés dans `__tests__/` à côté du fichier source (`<dir>/__tests__/<file>.test.ts`). Pattern `AAA` (Arrange / Act / Assert) obligatoire avec commentaires explicites. `mocks` typés : sous-classe du `port` abstrait avec chaque méthode = `vi.fn<Signature>()`, jamais de `InMemoryXxx` ni de cast `as unknown as`. Stratégie par layer : `domain` = pas de mock, `application` = mocks typés, `infrastructure` = real Postgres via docker/testcontainers, `e2e` = `Test.createTestingModule` + `supertest`.

## Do

- Layout : `<dir>/__tests__/<source>.test.ts`. Pattern auto-discover par `vitest.config.ts`.
- Pattern `AAA` avec commentaires :
  ```ts
  it("transitions from draft to sent via send()", () => {
      // Arrange
      const draft = QuoteStatus.draft();

      // Act
      const sent = draft.send();

      // Assert
      expect(sent.isSent()).toBe(true);
  });
  ```
  Pour un test d'erreur, `// Act + Assert` combinés autour de `expect(() => ...).toThrow(...)`.
- Mocks typés : une classe `<Port>Mock` qui extend le port abstrait et remplace chaque méthode par `vi.fn<Signature>()`.
  ```ts
  export class QuoteCommandRepositoryMock extends QuoteCommandRepository {
      public findAggregateById = vi.fn<(id: string) => Promise<Quote | null>>();
      public create = vi.fn<(quote: Quote) => Promise<void>>();
      public update = vi.fn<(quote: Quote) => Promise<void>>();
  }
  ```
  Configurer dans chaque test via `.mockResolvedValue(...)` / `.mockRejectedValue(...)`.
- `UnitOfWorkMock` — expose un `context` en property avec des `<Port>Mock`, et `execute = vi.fn(async (cb) => cb(this.context))`. Assert ensuite `execute` appelé une fois (preuve de la tx) + méthodes du context appelées avec les bons arguments.
- Domain tests : instancier les vrais VOs / aggregates, aucun mock. Tester les invariants (`create` invalid → `ValidationDomainError`), les transitions (`send` sur `sent` → `InvalidTransitionDomainError`), et `pullEvents()` pour vérifier les events émis.
- Application tests : `UnitOfWorkMock` + `<Port>Mock` injectés, assert les appels, assert `outbox.enqueue` reçoit les bons events.
- Infra tests : real Postgres via docker-compose (container `database`), `beforeEach` truncate. Pas de SQLite / stub.
- E2E : `NestFactory.createTestingApp` + `supertest`, vraie DB, vrai outbox.
- Test data : `const QUOTE_ID = "019..." as const` en haut du fichier, UUID v7 hardcodés. Numéric literals autorisés dans `__tests__/**` (override Biome `noMagicNumbers: off`).

## Don't

- `InMemoryXxxRepository` avec `Map<string, IQuoteView>` — le `port` evolue, le fake drift silencieusement.
- Cast `as unknown as <Port>` pour fabriquer un mock — extend le port abstrait.
- `vi.fn()` sans type parameter — toujours `vi.fn<Signature>()`. TypeScript doit catcher les signatures incompatibles.
- `jest.mock(...)` / automock — toujours des mocks explicites instanciés par test.
- Mocker le domain (VOs, aggregates) — instancier les vrais.
- Hit la DB dans un unit test — si tu en as besoin, c'est un integration test.
- Real `setTimeout` / `setInterval` — utiliser `vi.useFakeTimers()`.
- `@faker-js/faker` dans les tests — hardcoder les valeurs suffit.
- `it.skip` / `it.only` committé — bloqué par Biome (`noSkippedTests`, `noFocusedTests`).
- Tests qui dépendent de l'ordre d'exécution ou de données laissées par un précédent test.

## Example

**Domain test** — `src/modules/quote/domain/value-objects/__tests__/quote-status.vo.test.ts`.

**Aggregate test** — `src/modules/quote/domain/aggregates/__tests__/quote.aggregate.test.ts`.

**Money VO test** — `src/modules/quote/domain/value-objects/__tests__/money.vo.test.ts`.

**Shape d'un mock** (référence) :

```ts
import type { Quote } from "@/modules/quote/domain/aggregates/quote.aggregate";
import { QuoteCommandRepository } from "@/modules/quote/domain/repositories/quote-command.repository";
import { vi } from "vitest";

export class QuoteCommandRepositoryMock extends QuoteCommandRepository {
    public findAggregateById = vi.fn<(id: string) => Promise<Quote | null>>();
    public create = vi.fn<(quote: Quote) => Promise<void>>();
    public update = vi.fn<(quote: Quote) => Promise<void>>();
}
```

**Shape d'un UnitOfWorkMock** (référence) :

```ts
export class UnitOfWorkMock extends UnitOfWorkService {
    public readonly context: UnitOfWorkContextService = {
        outbox: new OutboxRepositoryMock(),
        quote: new QuoteCommandRepositoryMock(),
    };
    public execute = vi.fn(async <TResult>(cb: (ctx: UnitOfWorkContextService) => Promise<TResult>) => cb(this.context));
}
```

## See also

- [`ddd.md`](./ddd.md) — `pullEvents()` pour assert les events émis.
- [`cqrs.md`](./cqrs.md) — `context.quote` / `QuoteQueryRepository` = les 2 ports à mocker selon le côté testé.
- [`unit-of-work.md`](./unit-of-work.md) — pattern `UnitOfWorkMock`.
