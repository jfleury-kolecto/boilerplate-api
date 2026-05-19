# Observability

## What

5 couches qui composent l'observabilité du repo :

1. **Correlation ID** — un UUID v7 propagé via `AsyncLocalStorage` à chaque appel HTTP entrant (`X-Correlation-Id`) et à chaque message SQS consommé. Persisté sur la row `outbox` au moment de l'`enqueue`, ré-injecté dans le scope ALS du subscriber par `SqsServerStrategy` à la sortie de la queue.
2. **Structured logging** — `PinoLoggerService` (impl de `LoggerService` Nest) émet du JSON ligne-par-ligne avec `correlationId` injecté automatiquement via `mixin`. En `NODE_ENV=local`, transport `pino-pretty` pour la lisibilité ; en prod, JSON brut consommé par dd-trace `logInjection`.
3. **Request logging** — `RequestLoggerMiddleware` log une ligne par requête après réponse, avec le `correlationId` du scope.
4. **Distributed tracing** — `dd-trace` initialisé via `initDatadog(service)` qui skip en local/test et tagge `service`/`env`/`version`. En prod, `dd.trace_id`/`dd.span_id` sont automatiquement co-injectés dans chaque log Pino.
5. **Worker health** — endpoint `/healthz` reflète la fraîcheur du `relay outbox` via `WorkerHealthRegistryService`.

Les logs utilisent toujours `@nestjs/common.Logger` (Nest le redirige vers `PinoLoggerService` via `app.useLogger`), jamais `console.*` (enforced par Biome).

## Do

### Correlation ID

- Wire `CorrelationMiddleware` **avant** `RequestLoggerMiddleware` dans `AppModule.configure()`. L'ordre compte : sinon le request log n'a pas d'id à reporter.
- Lire le header `X-Correlation-Id` entrant ; s'il est absent, générer un UUID v7 via `correlationContext.generate()`. Toujours répondre avec le même header pour permettre au client de retrouver sa requête côté logs.
- Injecter `CorrelationContextService` (classe abstraite, dans `shared/correlation/domain/services/`) là où tu as besoin de l'id (rare en business code — Pino l'auto-injecte déjà). La classe abstraite sert directement de DI token Nest (pas de Symbol).
- `OutboxDrizzleRepository.enqueue()` capture l'id courant et le persiste dans `outbox.correlation_id` ; si pas de scope (cron, future job hors HTTP), `correlationId = null` + warn log. Pas de throw.
- Côté subscriber SQS : `SqsServerStrategy` lit `envelope.detail.correlationId` et wrappe l'invocation du handler dans `correlationContext.run(id, () => ...)`. Si l'envelope n'en contient pas (event legacy, emitter externe), il en génère un nouveau plutôt que de laisser `undefined`.

### Structured logging

- Format canonique :
  ```jsonc
  {
    "timestamp": "2026-04-30T12:34:56.789Z",
    "level": "info",
    "message": "POST /quote/:id/send 200 - 42.3ms cid=...",
    "correlationId": "019ad951-...",
    "service": "boilerplate-api-api",
    "env": "production",
    "version": "1.2.3",
    "context": "RequestLoggerMiddleware",
    "dd": { "trace_id": "...", "span_id": "..." }
  }
  ```
- Toujours passer par `new Logger(<context>)` — Nest le redirige vers `PinoLoggerService`. Ne jamais instancier Pino à la main.
- Le `mixin` Pino lit `correlationContext.get()` à chaque émission ; aucun caller n'a à threader l'id manuellement.

### Request logging / dd-trace / healthz

- Laisser `RequestLoggerMiddleware` s'occuper du log par requête — une seule ligne `<METHOD> <URL> <STATUS> - <MS>ms cid=<id>` après `res.on("finish")`. Level selon le status : `error` sur 5xx, `warn` sur 4xx, `log` sinon.
- Initialiser `dd-trace` via `initDatadog("boilerplate-api-api")` tout en haut de `src/api.ts`, **avant** `NestFactory.create`. Le helper skip si `NODE_ENV` vaut `"local"` ou `"test"`.
- Pour signaler un état dégradé depuis un handler, throw `ServiceUnavailableException(payload)` — le `HttpExceptionFilter` renvoie un 503 structuré.
- `/healthz` est routé sur `HealthzController.health()` qui interroge `WorkerHealthRegistryService` : 200 avec `{ healthy, lastTickAt, thresholdMs }` si le relay a tické dans les `2 × OUTBOX_RELAY_INTERVAL_MS`, sinon 503.
- `WorkerHealthRegistryService.markTick()` est appelé au début de `OutboxRelayService._tick()` — inutile de l'appeler ailleurs.

## Don't

- Logger manuellement avec `console.log` (Biome bloque) ou un Pino instancié à la main — passer par Nest `Logger`, qui est routé vers `PinoLoggerService`.
- Loguer les `body` de requête en production — ça leak des données sensibles. Le request logger n'a accès qu'à URL + status + duration.
- Threader manuellement le `correlationId` à travers les arguments — le mixin Pino le récupère du `AsyncLocalStorage`. Du param drilling défait toute la simplicité.
- Wirer `RequestLoggerMiddleware` avant `CorrelationMiddleware` — le scope ALS n'existe pas encore, le log n'aurait pas l'id.
- Mettre `pino-pretty` dans `transport` en prod — perte massive de débit. C'est conditionné par `NODE_ENV === "local"`.
- Stocker le `correlationId` dans une colonne d'aggregate métier — il vit sur la row `outbox` (cross-cutting), pas dans le domain.
- Initialiser `dd-trace` sans `service`/`env`/`version` — les traces en prod deviennent illisibles.

## Example

**Correlation port** — `src/shared-kernel/correlation/domain/services/correlation-context.service.ts` :

```ts
export abstract class CorrelationContextService {
    public abstract get(): string | undefined;
    public abstract run<TResult>(correlationId: string, callback: () => TResult): TResult;
    public abstract generate(): string;
}
```

**Middleware** — `src/shared-kernel/http/infrastructure/middlewares/correlation.middleware.ts` :

```ts
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
    public constructor(private readonly _correlation: CorrelationContextService) {}

    public use(req: IncomingMessage, res: ServerResponse, next: () => void): void {
        const incoming = req.headers["x-correlation-id"];
        const fromHeader = Array.isArray(incoming) ? incoming[0] : incoming;
        const correlationId =
            typeof fromHeader === "string" && fromHeader.length > 0 ? fromHeader : this._correlation.generate();
        res.setHeader("x-correlation-id", correlationId);
        this._correlation.run(correlationId, () => { next(); });
    }
}
```

**Pino setup** — `src/shared-kernel/observability/infrastructure/services/pino-logger.service.ts` :

```ts
this._logger = pino({
    base: { env, service, version },
    formatters: { level: (label) => ({ level: label }) },
    messageKey: "message",
    mixin: () => {
        const correlationId = correlation.get();
        return correlationId !== undefined ? { correlationId } : {};
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(pretty && { transport: { target: "pino-pretty", options: { /* ... */ } } }),
});
```

**Wiring** — `src/api.ts` :

```ts
const logger = app.get<PinoLoggerService>(PINO_LOGGER_SERVICE_TOKEN);
app.useLogger(logger);
```

**Outbox propagation** — `OutboxDrizzleRepository.enqueue()` lit `correlationContext.get()`, persiste dans `outbox.correlation_id`. `EventBridgePublisherService` embarque `correlationId` dans le `Detail` JSON. `SqsServerStrategy` extrait et `run()` le handler dans le scope.

**Healthcheck** — inchangé : `src/shared-kernel/observability/presentation/controllers/healthz.controller.ts` répond 200 ou 503 selon `WorkerHealthRegistryService.isHealthy()`.

## End-to-end trace

Une requête utilisateur traverse :

```
client                   →  X-Correlation-Id: cid-1 (or generated)
↓
CorrelationMiddleware    →  ALS.run(cid-1, ...)
↓
RequestLoggerMiddleware  →  log "POST /quote/:id/send 200 cid=cid-1"
↓
SendQuoteCommand.execute →  context.outbox.enqueue(events)
↓                            └→ OutboxDrizzleRepository.enqueue()
                                  inserts row { correlation_id: cid-1 }
[tx commit]
↓
OutboxRelayService._tick →  reads row, IOutboxMessage { correlationId: cid-1 }
↓
EventBridgePublisher     →  Detail JSON includes "correlationId": "cid-1"
↓
[network → EventBridge → SQS]
↓
SqsServerStrategy        →  parses, ALS.run(cid-1, () => handler(detail))
↓
NotificationQuoteEventCt →  SendQuoteToCustomerCommand.execute()
↓                            └→ Logger.log("...") emits with correlationId: cid-1
LoggerEmailSenderService →  log "Email sent to ... cid=cid-1"
```

Tout grep sur `cid-1` dans les logs (HTTP + relay + SQS consumer) reconstruit la trace complète.

## See also

- [`outbox.md`](./outbox.md) — `correlation_id` colonne + propagation via le payload EventBridge.
- [`error-handling.md`](./error-handling.md) — `ServiceUnavailableException` passthrough via le `filter`.
- [`http-routes.md`](./http-routes.md) — `/healthz` déclaré via `@ApiRoute`.
