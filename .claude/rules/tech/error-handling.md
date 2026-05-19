# Error handling

## What

4 familles d'erreurs côté domaine/application/infra/présentation, déclarées dans `src/shared-kernel/errors/domain/*.error.ts`. Un `exception filter` global (`HttpExceptionFilter`) catch tout, mappe chaque famille vers un `status code` HTTP et sérialise dans un body standard `{ message, payload }`. Les `HttpException` natives de Nest passent through (utile pour `ServiceUnavailableException` sur `/healthz`).

## Do

- Throw depuis la couche la plus basse qui détecte le problème :
  - `ValidationDomainError` (→ 400) pour une input invalide, un VO qui rejette sa valeur, un invariant violé dès la construction.
  - `InvalidTransitionDomainError` (→ 409) pour une transition de state machine refusée (`QuoteStatus.send()` sur un quote déjà `sent`).
  - `RessourceNotFoundApplicationError` (→ 404) quand un `findById` retourne `null` côté `handler`.
  - `RessourceAlreadyExistsApplicationError` (→ 409) quand un `create` hit une contrainte d'unicité déjà satisfaite.
- Passer du contexte structuré dans `payload`, pas concaténé dans `message` :
  ```ts
  throw new ValidationDomainError("Invalid currency", { received: raw, allowed: ["EUR", "USD"] });
  ```
- Laisser les erreurs propager jusqu'au `filter` global — pas de `try/catch` décoratif.
- Throw `HttpException` native (ex : `ServiceUnavailableException`) pour un 503 structuré — le `filter` passe les `HttpException` through avec leur status.
- `PresentationError` + `InfrastructureError` existent mais sont rares — utilisées par le `ValidationPipe` et certains `Drizzle repositories`.

## Don't

- `try/catch` dans un `controller` pour convertir en `status code` — le `filter` s'en occupe.
- Créer une nouvelle famille d'erreurs hors des 4 — étendre une famille existante.
- Concaténer dans le `message` (`\`Quote ${id} has ${n} lines\``) — mettre les champs dans `payload`.
- Throw `Error` générique depuis le domain — sans type, le `filter` tombe sur le fallback 500.
- Catcher une erreur domain pour la relogger — elle est déjà loggée par le `filter`.

## Example

**Famille domain** — `src/shared-kernel/errors/domain/domain.error.ts` :

```ts
export abstract class DomainError extends Error {
    public readonly payload: Record<string, unknown>;
    public constructor(message: string, payload: Record<string, unknown> = {}) { /* ... */ }
}

export class ValidationDomainError extends DomainError {}
export class InvalidTransitionDomainError extends DomainError {}
```

**Mapping table** — `src/shared-kernel/errors/infrastructure/mappers/errors.mapper.ts` :

| Error class | Status |
|---|---|
| `ValidationDomainError` | 400 |
| `InvalidTransitionDomainError` | 409 |
| `RessourceNotFoundApplicationError` | 404 |
| `RessourceAlreadyExistsApplicationError` | 409 |
| `DtoValidationPresentationError` | 400 |
| `UnauthorizedPresentationError` | 401 |
| `ValidationInfrastructureError` | 500 |
| `HttpException` natif | son `getStatus()` |
| Autre | 500 (fallback, loggé) |

**Filter** — `src/shared-kernel/errors/infrastructure/filters/http-exception.filter.ts` :

```ts
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    public catch(exception: unknown, host: ArgumentsHost): void {
        // 1. domain / application / infra / presentation → lookup mapping
        // 2. HttpException native → passthrough status + payload
        // 3. sinon → 500 "This error is not handled by the application"
    }
}
```

**Usage** — `src/modules/quote/application/commands/send-quote.command.ts` :

```ts
const quote = await context.quote.findAggregateById(rawId);
if (!quote) throw new RessourceNotFoundApplicationError(`Quote ${rawId} not found`);
```

**Body de réponse** :

```json
{ "message": "Quote ... not found", "payload": {} }
```

## See also

- [`http-routes.md`](./http-routes.md) — déclarer les `errors` dans `@ApiRoute` pour Scalar.
- [`ddd.md`](./ddd.md) — les erreurs domain sont throw depuis les VOs/aggregates.
- [`observability.md`](./observability.md) — le `request logger middleware` log le `status code` et le temps, le `filter` log le body d'erreur.
