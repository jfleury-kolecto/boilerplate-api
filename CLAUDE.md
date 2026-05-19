# Project rules

Index des règles Claude pour ce repo. Détail dans [`.claude/rules/`](./.claude/rules/).

## Stack

- NestJS 11 + Fastify + strict TypeScript
- PostgreSQL via Drizzle ORM (versioned migrations)
- AWS SQS via outbox pattern
- Biome (lint + format), dependency-cruiser (archi), knip (dead code), Vitest (tests)

## Entry point

`src/api.ts` → HTTP API + outbox relay in-process (`pnpm dev` / `pnpm start`). `GET /healthz` reporte le dernier tick du relay.

## Precedence

1. **Automated rules** (bloquent CI et pre-commit) : `biome.json`, `.dependency-cruiser.json`, `knip.json`, `tsconfig.json`.
2. **Written rules** (ce dossier) : conventions non automatisées.

Si une règle écrite contredit un outil automatisé, l'outil gagne.

## Top-level layout

```
src/
  api.ts                                                   (entry point — boot HTTP + microservices)
  composition-root/                                        (5ᵉ racine, wire-up Nest unique)
  modules/<context>/                                       (bounded contexts métier — quote, notification…)
  shared/<slice>/                                          (slices techniques transverses — http, config, observability, database, id, outbox, errors, building-blocks, messaging, correlation, auth, user-context…)
```

- **`src/composition-root/`** — providers + `@Module` Nest. Seul endroit autorisé à voir `application/` + `infrastructure/` + `presentation/`.
- **`src/modules/<context>/`** — bounded contexts métier, isolés (`cross-context-forbidden`). 4 layers stricts.
- **`src/shared-kernel/<slice>/`** — primitives techniques (HTTP plumbing, env config, observability, DB, id, outbox, errors). Mêmes 4 layers stricts.

Détail dans [`tech/clean-architecture.md`](./.claude/rules/tech/clean-architecture.md) et [`tech/dependency-injection.md`](./.claude/rules/tech/dependency-injection.md).

## Scaffold — `src/modules/<context>/` + `src/composition-root/`

```
src/modules/<context>/
  domain/
    aggregates/       <name>.aggregate.ts
    entities/         <name>.entity.ts
    value-objects/    <name>.vo.ts
    events/           <verb-past>.event.ts
    commands/         <verb>-<aggregate>.command.ts       (intent DTO)
    queries/          get-<name>.view.ts
    primitives/       <aggregate>.primitives.ts
    repositories/     <aggregate>-command.repository.ts
                      <aggregate>-query.repository.ts
  application/
    commands/         <verb>-<aggregate>.command.ts        (handler)
    queries/          <name>.query.ts
  infrastructure/
    repositories/     <aggregate>-command.drizzle-repository.ts
                      <aggregate>-query.drizzle-repository.ts
    services/         <name>.service.ts
  presentation/
    controllers/      <aggregate>-command.controller.ts
                      <aggregate>-query.controller.ts
    dependency-injection/
                      <aggregate>.token.ts                 (Symbol tokens, consommés par les controllers)
    dto/
      inputs/         <verb>-<aggregate>.input-dto.ts
      outputs/        <aggregate>.output-dto.ts
    mappers/          <aggregate>-output-dto.mappers.ts
    <aggregate>.api.ts                                     (tag + param constants)

src/composition-root/                                      (5ᵉ racine, hors layers)
  app.module.ts
  <slice>/
    <aggregate>.module.ts                                  (@Module : controllers + providers + imports)
    <aggregate>.provider.ts                                (factory providers : useFactory câble adapter + handler)
```

## `src/shared-kernel/` slices

| Slice | Rôle |
| --- | --- |
| `http/` | Cross-cutting HTTP (`RequestLoggerMiddleware`, `validation.pipe`, `@ApiRoute` decorator). |
| `config/` | Validation des env vars (`envValidationService` + `EnvironmentVariablesInputDto`). |
| `observability/` | Logging/tracing (`datadog`), worker health registry (port + impl), endpoint `/healthz`. |
| `database/` | Drizzle ORM, `DrizzleService`, `TransactionRunner`. |
| `id/` | `IdService` port + `UuidService` impl (UUID v7). |
| `outbox/` | Outbox table + relay + publisher port. |
| `errors/` | 4 familles d'erreurs + `HttpExceptionFilter`. |
| `building-blocks/` | Bases DDD (`AggregateRoot`, `Entity`, `ValueObject`, `DomainEvent`). |
| `messaging/` | `SqsServerStrategy` (Nest microservice transport). |
| `correlation/` | `CorrelationContextService` (port + AsyncLocalStorage impl) — id propagé HTTP → outbox → SQS. |
| `auth/` | `AuthenticationService` (JWT verify via JWKS) + `AuthorizationService` (RBAC). |
| `user-context/` | `UserContextService` (port + ALS impl) — `IAuthenticatedUser` propagé après l'auth. |

## Rules index

### Tech

- [`tech/clean-architecture.md`](./.claude/rules/tech/clean-architecture.md) — 4 layers, imports autorisés, scaffold template.
- [`tech/ddd.md`](./.claude/rules/tech/ddd.md) — `value object`, `entity`, `aggregate root`, `domain event`, `domain service`, `domain error`.
- [`tech/cqrs.md`](./.claude/rules/tech/cqrs.md) — 2 `controllers` + 2 `repository ports` sur la même table.
- [`tech/outbox.md`](./.claude/rules/tech/outbox.md) — enqueue transactionnel + relay + `exponential backoff` + `dead letter`.
- [`tech/unit-of-work.md`](./.claude/rules/tech/unit-of-work.md) — `execute(cb)` avec `context.{quote, outbox}`.
- [`tech/dependency-injection.md`](./.claude/rules/tech/dependency-injection.md) — `factory providers`, `Symbol tokens`, composition root unique sous `src/composition-root/`.
- [`tech/error-handling.md`](./.claude/rules/tech/error-handling.md) — 4 familles + `HttpExceptionFilter` + mapping.
- [`tech/http-routes.md`](./.claude/rules/tech/http-routes.md) — `@ApiRoute` composite + Scalar + `operationId`.
- [`tech/observability.md`](./.claude/rules/tech/observability.md) — `RequestLoggerMiddleware` + `dd-trace` + `/healthz`.
- [`tech/testing.md`](./.claude/rules/tech/testing.md) — Vitest, AAA, mocks typés, stratégie par layer.
- [`tech/principles.md`](./.claude/rules/tech/principles.md) — DRY, KISS, YAGNI, fail-fast, SRP avec exemples du repo.
- [`tech/nestjs.md`](./.claude/rules/tech/nestjs.md) — do/don't sur Nest 11 + Fastify (DI, lifecycle, global pipes/filters).
- [`tech/drizzle.md`](./.claude/rules/tech/drizzle.md) — do/don't sur schema, migrations, surgical SELECT, `SKIP LOCKED`.
- [`tech/auth.md`](./.claude/rules/tech/auth.md) — OIDC + JWT + RBAC, `UserContextService`, jwks-mock en local.
- [`tech/tenant-isolation.md`](./.claude/rules/tech/tenant-isolation.md) — Postgres RLS + `set_config` au tx open + colonne `tenant_id`.

### Workflow

- [`workflow/commits.md`](./.claude/rules/workflow/commits.md) — Conventional Commits, atomic commits, MR cap 1000 lignes, protocole Claude step-by-step.
- [`workflow/checks.md`](./.claude/rules/workflow/checks.md) — `pnpm check | arch | dead | tsc | test`, husky, CI.

## Main scripts

```bash
pnpm dev                    # API watch (outbox relay in-process)
pnpm db:generate            # migration from schema
pnpm db:migrate             # apply migrations
pnpm db:studio              # DB UI
pnpm tsc                    # type check
pnpm check / check:fix      # Biome
pnpm arch                   # dependency-cruiser
pnpm arch:graph             # SVG dependency graph (requires graphviz)
pnpm dead                   # knip
pnpm test                   # Vitest
pnpm openapi:export         # export openapi.json
```
