# Dependency Injection

## What

La DI passe par des `factory providers` (`useFactory`) et des `tokens` `Symbol()`. Les `handlers`, `repositories` et `domain services` restent 100 % framework-agnostic — aucune annotation NestJS dessus. Seuls les `controllers` portent des décorateurs Nest côté layers. La wire-up Nest (providers + `@Module`) est extraite dans une **composition root** unique sous `src/composition-root/` — pattern canonique (Mark Seemann, *DI Principles*, ch. 4 ; Robert C. Martin, *Clean Architecture*, ch. 26). C'est le seul endroit qui voit `application/` + `infrastructure/` + `presentation/` simultanément. Les 4 layers métier sont strictement unidirectionnels, sans `pathNot` carve-out dependency-cruiser.

## Split tokens vs providers

- **Tokens** (`Symbol`, aucune dépendance) → `<slice>/presentation/dependency-injection/<aggregate>.token.ts`. Importés par les controllers (intra-layer, intra-slice) et par les providers depuis `composition-root/`.
- **Providers + Modules** (câblent adapters concrets + handlers + controllers) → `src/composition-root/<slice>/<aggregate>.{provider,module}.ts`.

Pourquoi ce split : si les tokens vivaient dans `composition-root/`, les controllers les importeraient → on rétablirait une exception `presentation → composition-root`. En gardant les tokens dans presentation et les providers dans composition-root, les 4 layers n'ont aucune raison d'importer la composition root.

## Do

- Déclarer un `token` par provider dans `<slice>/presentation/dependency-injection/<aggregate>.token.ts` :
  ```ts
  export const QUOTE_CREATE_COMMAND_TOKEN: unique symbol = Symbol("QUOTE_CREATE_COMMAND_TOKEN");
  ```
  Naming : `UPPER_SNAKE_CASE_TOKEN`, avec prefix du `bounded context`.
- Écrire les `factory providers` dans `src/composition-root/<slice>/<aggregate>.provider.ts` :
  ```ts
  export const QUOTE_CREATE_COMMAND_PROVIDER: Provider<CreateQuoteCommand> = {
      inject: [UUID_SERVICE_TOKEN, QUOTE_UNIT_OF_WORK_TOKEN],
      provide: QUOTE_CREATE_COMMAND_TOKEN,
      useFactory: (idService, uow) => new CreateQuoteCommand(idService, uow),
  };
  ```
- Enregistrer les `providers` et `controllers` dans un `@Module` sous `src/composition-root/<slice>/<aggregate>.module.ts`.
- Côté `controller`, injecter via `@Inject(TOKEN)` en paramètre de constructor — le token est importé depuis `presentation/dependency-injection/`.
- Tenir `handlers` / `repositories` / `domain services` sans aucun décorateur Nest.

## Don't

- `@Injectable()` sur un `handler` application, un `Drizzle repository`, un `domain service`, ou tout ce qui vit dans `application/` ou `domain/`.
- `property injection` (`@Inject() private foo: Foo`) — toujours via constructor.
- `forwardRef` — c'est une odeur de cycle de dépendance, refactor pour casser le cycle.
- `tokens` en `string` (`"QUOTE_REPO"`) — uniquement `Symbol`.
- Mettre un `token` hors de `<slice>/presentation/dependency-injection/`.
- Mettre un `provider` ou un `@Module` hors de `src/composition-root/`.
- Importer `src/composition-root/` depuis n'importe quel layer (bloqué par la règle `layers-no-composition-root`).
- Un `provider` qui `useClass` sur un business class — préférer `useFactory` pour rester explicite sur les dépendances injectées (sauf cas trivial type `UuidService`).

## Example

**Token** — `src/modules/quote/presentation/dependency-injection/quote.token.ts` :

```ts
export const QUOTE_QUERY_REPOSITORY_TOKEN: unique symbol = Symbol("QUOTE_QUERY_REPOSITORY_TOKEN");
export const QUOTE_CREATE_COMMAND_TOKEN: unique symbol = Symbol("QUOTE_CREATE_COMMAND_TOKEN");
// ...
```

**Provider** — `src/composition-root/quote/quote.provider.ts` :

```ts
export const QUOTE_QUERY_REPOSITORY_PROVIDER: Provider<QuoteQueryRepository> = {
    inject: [DRIZZLE_SERVICE_TOKEN],
    provide: QUOTE_QUERY_REPOSITORY_TOKEN,
    useFactory: (drizzle) => new QuoteQueryDrizzleRepository(drizzle.db),
};
```

**Module** — `src/composition-root/quote/quote.module.ts` : liste providers + controllers + imports d'autres modules, `exports: []` sauf exception.

**Controller** — `src/modules/quote/presentation/controllers/quote-command.controller.ts` :

```ts
public constructor(
    @Inject(QUOTE_CREATE_COMMAND_TOKEN)
    private readonly _createQuote: CreateQuoteCommand,
    // ...
) {}
```

## See also

- [`nestjs.md`](./nestjs.md) — specifics NestJS (Fastify, ConfigService, lifecycle hooks).
- [`clean-architecture.md`](./clean-architecture.md) — composition root, règle `layers-no-composition-root`.
- [`cqrs.md`](./cqrs.md) — 2 `controllers` → 2 familles de tokens.
