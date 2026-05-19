# HTTP routes

## What

Chaque endpoint HTTP est déclaré via le decorator composite `@ApiRoute<TResponse>(options)` (cf. `src/shared-kernel/http/presentation/decorators/api-route.decorator.ts`). Il compose en une seule annotation le verbe HTTP, le `status code`, les métadonnées Swagger/Scalar (`ApiOperation`, `ApiParam`, `ApiBody`, `ApiQuery`, `ApiResponse`…), les erreurs documentées et la `response`. Les constants partagées par `bounded context` (`<AGGREGATE>_COMMAND_API_TAG`, `<AGGREGATE>_QUERY_API_TAG`, `<AGGREGATE>_ID_PARAM`) vivent dans `presentation/<aggregate>.api.ts`.

## Do

- Utiliser `@ApiRoute({...})` sur chaque méthode de `controller`. Champs required : `method`, `path`, `status`, `operationId`, `summary`, `description`, `response`, `responseDescription`.
- Grouper les erreurs possibles dans `errors: IApiRouteError[]` avec `{ description, status: HttpStatus }` :
  ```ts
  errors: [
      { description: "Quote not found.", status: HttpStatus.NOT_FOUND },
      { description: "Quote must be in draft status.", status: HttpStatus.CONFLICT },
  ]
  ```
- Extraire les paramètres partagés dans `presentation/<aggregate>.api.ts` :
  - `<AGGREGATE>_COMMAND_API_TAG` — `{ name, description }` du côté write (lifecycle `draft → sent → accepted | rejected`). Wirée dans `DocumentBuilder.addTag(...)` côté `api.ts`.
  - `<AGGREGATE>_QUERY_API_TAG` — `{ name, description }` du côté read (projections / `views`). Wirée séparément.
  - Le split par côté CQRS donne à chaque controller sa propre description Markdown dans Scalar (`Quote · Commands` vs `Quote · Queries`) au lieu d'un tag fourre-tout.
  - `<AGGREGATE>_ID_PARAM` — `ApiParamOptions` réutilisé sur toutes les routes qui prennent `:id`.
- `operationId` stable et camelCase (`getQuote`, `sendQuote`, `addQuoteLine`) — utilisé par Scalar pour les URLs et par les générateurs de SDK.
- Status codes :
  - `201 Created` pour `POST /quote`, `POST /quote/:id/lines` (nouvelle ressource ou sous-ressource).
  - `200 OK` pour reads (`GET`) et state transitions (`POST /quote/:id/send|accept|reject`).
  - `503 Service Unavailable` pour un état dégradé (`/healthz` quand le relay est stale).
- Descriptions Markdown dans `description` — Scalar les rend en corps de page.

## Don't

- Empiler manuellement `@Get/@Post`, `@HttpCode`, `@ApiOperation`, `@ApiParam`, `@ApiBody`, `@ApiOkResponse`, `@ApiNotFoundResponse`, etc. sur chaque route — utiliser `@ApiRoute` qui les compose en un objet typé.
- Omettre `operationId` — sans lui, Scalar tombe sur un slug auto-généré instable.
- Mettre la même `description` Markdown dans `<AGGREGATE>_COMMAND_API_TAG` et `<AGGREGATE>_QUERY_API_TAG` — chaque côté décrit son propre lifecycle / ses propres projections, pas un texte générique fourre-tout.
- Wirer un seul `<AGGREGATE>_API_TAG` au singulier sur les 2 controllers — Scalar le rend en doublon et perd la distinction commands / queries.
- Rendre l'endpoint `response` dépendant d'une `VO` — toujours un DTO de primitives.
- Utiliser `@Res()` pour hack le `status code` — préférer throw `HttpException`, le `filter` le mappe.

## Example

**Shape du decorator** — `src/shared-kernel/http/presentation/decorators/api-route.decorator.ts` :

```ts
interface IApiRouteOptions<TResponse> {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "ALL";
    path?: string | string[];
    status: HttpStatus;
    operationId: string;
    summary: string;
    description: string;
    response?: Type<TResponse>;
    responseDescription: string;
    body?: Type<unknown> | ApiBodyOptions;
    params?: readonly ApiParamOptions[];
    queries?: readonly ApiQueryOptions[];
    errors?: readonly IApiRouteError[];
}

export const ApiRoute = <TResponse>(options: IApiRouteOptions<TResponse>): MethodDecorator & ClassDecorator => { /* ... */ };
```

**Constants du bounded context** — `src/modules/quote/presentation/quote.api.ts` :

```ts
export const QUOTE_COMMAND_API_TAG = {
    description: [/* Markdown — write side: lifecycle draft → sent → accepted | rejected */].join("\n"),
    name: "Quote · Commands",
} as const;

export const QUOTE_QUERY_API_TAG = {
    description: [/* Markdown — read side: full quote vs compact summary projections */].join("\n"),
    name: "Quote · Queries",
} as const;

export const QUOTE_ID_PARAM: ApiParamOptions = {
    description: "Quote UUID v7.",
    example: "019ad951-368a-7de5-b7ba-add19cfd187b",
    name: "id",
    required: true,
    type: String,
};
```

`QUOTE_COMMAND_API_TAG.name` est appliqué sur `QuoteCommandController` via `@ApiTags(QUOTE_COMMAND_API_TAG.name)` ; idem `QUOTE_QUERY_API_TAG.name` sur `QuoteQueryController`. Les deux tags sont enregistrés côté `api.ts` via `DocumentBuilder.addTag(...)`.

**Usage** — `src/modules/quote/presentation/controllers/quote-command.controller.ts` :

```ts
@ApiRoute({
    description: "Transitions the quote from `draft` to `sent`. Requires at least one line.",
    errors: [
        { description: "Quote not found.", status: HttpStatus.NOT_FOUND },
        { description: "Quote must be in draft status with at least one line.", status: HttpStatus.CONFLICT },
    ],
    method: "POST",
    operationId: "sendQuote",
    params: [QUOTE_ID_PARAM],
    path: ":id/send",
    response: QuoteOutputDto,
    responseDescription: "Quote sent.",
    status: HttpStatus.OK,
    summary: "Send draft quote",
})
public async sendQuote(@Param("id") id: string): Promise<QuoteOutputDto> { /* ... */ }
```

## See also

- [`error-handling.md`](./error-handling.md) — ce qui se passe quand un `handler` throw une des erreurs listées dans `errors`.
- [`cqrs.md`](./cqrs.md) — 2 controllers physiques, 2 tags Scalar distincts (commands / queries).
- [`observability.md`](./observability.md) — le `request logger middleware` logue chaque requête avec son `status`.
