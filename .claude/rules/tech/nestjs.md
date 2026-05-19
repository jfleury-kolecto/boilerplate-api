# NestJS

## What

Nest 11 + Fastify comme framework de composition. Il orchestre la DI et le routing HTTP mais ne contamine ni le `domain/` ni l'`application/`. Les seuls fichiers qui portent des décorateurs Nest sont les `controllers`, les `Nest modules`, le `middleware` de log, le `filter` d'exception et le `validation pipe`. Tout le reste est du TypeScript vanilla instancié via `factory providers`.

## Do

- `@Controller("path")` + `@Get/@Post/@Put/@Patch/@Delete` uniquement dans `presentation/controllers/`. Idéalement composé via `@ApiRoute({...})` (cf. `http-routes.md`).
- `@Module({...})` + `useFactory providers` uniquement dans `src/composition-root/<slice>/` (composition root unique). Tokens (`Symbol`) consommés via `@Inject` vivent dans `<slice>/presentation/dependency-injection/`.
- `@Inject(TOKEN)` en paramètre de constructor côté controller. Jamais `@Inject()` en property.
- `ConfigService` pour lire les env vars — `configService.get<string>("FOO")`. Jamais `process.env` directement (bloqué par Biome `noProcessEnv`), sauf dans les entry points hors Nest (`drizzle.config.ts`, `datadog.ts`).
- `OnModuleInit` / `OnModuleDestroy` sur les services qui démarrent/ferment des ressources (timers, DB pool, HTTP servers custom). Exemple : `OutboxRelayService` enregistre et détruit son interval.
- `FastifyAdapter` en entry (`src/api.ts`). Pas d'accès à `request.raw` sauf cas extrême.
- `app.useGlobalPipes(createValidationPipe())` et `app.useGlobalFilters(new HttpExceptionFilter())` — pipe et filter globaux, pas de configuration par controller.
- Scheduler : `@nestjs/schedule` + `SchedulerRegistry.addInterval(name, setInterval(...))` dans `onModuleInit`, `deleteInterval` dans `onModuleDestroy`.

## Don't

- `@Injectable()` sur un `handler`, `repository`, `domain service`, VO, aggregate, ou tout ce qui vit dans `application/` ou `domain/` — passer par `useFactory`.
- `property injection` (`@Inject() private _foo: Foo`) — toujours via constructor.
- `forwardRef(() => ...)` — c'est un code smell de depandance circulaire à casser, pas à contourner.
- `@Request()` / `@Response()` en paramètre d'un handler — ça couple le handler à Fastify.
- `process.env.FOO` (Biome bloque) — passer par `ConfigService`. Exceptions documentées : entry points hors Nest.
- Plusieurs `exception filters` globaux — un seul (`HttpExceptionFilter`).
- `@Module` avec auto-discovery (glob `providers`) — tout listé explicitement.

## Example

**Controller** — `src/modules/quote/presentation/controllers/quote-command.controller.ts` :

```ts
@ApiTags(QUOTE_API_TAG.name)
@Controller("quote")
export class QuoteCommandController {
    public constructor(
        @Inject(QUOTE_CREATE_COMMAND_TOKEN)
        private readonly _createQuote: CreateQuoteCommand,
        // ...
    ) {}
    // ...
}
```

**Module** — `src/composition-root/quote/quote.module.ts` :

```ts
@Module({
    controllers: [QuoteCommandController, QuoteQueryController],
    exports: [],
    imports: [UuidModule, DatabaseModule],
    providers: [
        QUOTE_QUERY_REPOSITORY_PROVIDER,
        QUOTE_CREATE_COMMAND_PROVIDER,
        // ...
    ],
})
export class QuoteModule {}
```

**Lifecycle hook** — `src/shared-kernel/outbox/infrastructure/services/outbox-relay.service.ts` :

```ts
public onModuleInit(): void {
    const interval = setInterval(() => void this._tick(), this._intervalMs);
    this._schedulerRegistry.addInterval(RELAY_INTERVAL_NAME, interval);
}

public onModuleDestroy(): void {
    this._stopping = true;
    if (this._schedulerRegistry.doesExist("interval", RELAY_INTERVAL_NAME)) {
        this._schedulerRegistry.deleteInterval(RELAY_INTERVAL_NAME);
    }
}
```

**Global pipe/filter** — `src/api.ts` :

```ts
app.useGlobalPipes(createValidationPipe());
app.useGlobalFilters(new HttpExceptionFilter());
```

## See also

- [`dependency-injection.md`](./dependency-injection.md) — `factory providers`, `Symbol tokens`, composition root.
- [`http-routes.md`](./http-routes.md) — comment `@ApiRoute` remplace l'empilement de décorateurs Nest/Scalar.
- [`error-handling.md`](./error-handling.md) — `HttpExceptionFilter` global.
- [`observability.md`](./observability.md) — `RequestLoggerMiddleware` wiré via `AppModule.configure()`.
