# NestJS 11 API Skeleton

A NestJS 11 API boilerplate built with **Clean Architecture**, **DDD**, **CQRS**, **Drizzle ORM**, **PostgreSQL**, and a **transactional Outbox** integrated with **AWS SQS**.

The **Quote** bounded context is included as a fully documented reference implementation.

## Features

- NestJS 11 + Fastify
- Clean Architecture with strict layer boundaries
- Domain-Driven Design (aggregates, value objects, domain events)
- CQRS (command / query separation)
- Drizzle ORM + PostgreSQL (versioned migrations)
- Transactional Outbox Pattern → AWS SQS
- Strict TypeScript
- Architecture enforcement (dependency-cruiser)
- OpenAPI export + Scalar docs
- Docker-ready local stack (PostgreSQL, LocalStack)

## Tech stack


| Layer        | Technology / pattern                     |
| ------------ | ---------------------------------------- |
| Framework    | NestJS 11, Fastify                       |
| ORM          | Drizzle ORM                              |
| Database     | PostgreSQL                               |
| Messaging    | AWS SQS (via Outbox)                     |
| Architecture | Clean Architecture, Hexagonal principles |
| Domain       | DDD                                      |
| Application  | CQRS                                     |
| Testing      | Vitest                                   |
| Tooling      | Biome, Knip, dependency-cruiser          |


## Prerequisites


| Tool                              | Notes                                           |
| --------------------------------- | ----------------------------------------------- |
| [Node.js](https://nodejs.org/)    | `>= 24.15.0` (see `engines` in `package.json`)  |
| [pnpm](https://pnpm.io/)          | `11.x` (see `packageManager` in `package.json`) |
| [Docker](https://www.docker.com/) | For local PostgreSQL and LocalStack             |


## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure

Starts PostgreSQL and LocalStack locally.

```bash
pnpm docker:up
```

### 3. Configure environment variables

Create your local `.env` from the example:

```bash
cp .env.example .env
```

Edit values if needed.

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Start the application

Runs the API in watch mode with the in-process outbox relay.

```bash
pnpm dev
```

### Local URLs


| Service           | URL                                                            |
| ----------------- | -------------------------------------------------------------- |
| API documentation | [http://localhost:3000/docs](http://localhost:3000/docs)       |
| Health check      | [http://localhost:3000/healthz](http://localhost:3000/healthz) |


## Available scripts


| Script                | Description                                |
| --------------------- | ------------------------------------------ |
| `pnpm dev`            | Start the API in watch mode                |
| `pnpm start`          | Start the API without watch mode           |
| `pnpm build`          | Build for production                       |
| `pnpm db:generate`    | Generate a migration from the schema       |
| `pnpm db:migrate`     | Apply pending database migrations          |
| `pnpm db:studio`      | Launch Drizzle Studio                      |
| `pnpm tsc`            | Run strict TypeScript type checking        |
| `pnpm check`          | Run Biome lint and format checks           |
| `pnpm check:fix`      | Auto-fix Biome issues                      |
| `pnpm arch`           | Run dependency-cruiser architecture checks |
| `pnpm arch:graph`     | Export architecture dependency graph (SVG) |
| `pnpm dead`           | Detect dead code and unused deps (Knip)    |
| `pnpm test`           | Run tests with Vitest                      |
| `pnpm openapi:export` | Build and export the OpenAPI specification |
| `pnpm docker:up`      | Start Docker Compose services              |


## Architecture overview

The codebase follows **Clean Architecture**, **DDD**, and **hexagonal** boundaries:

- `**src/modules/<context>/`** — isolated bounded contexts (e.g. `quote`), each with four layers: `domain`, `application`, `infrastructure`, `presentation`
- `**src/shared-kernel/<slice>/`** — cross-cutting technical slices (HTTP, config, database, outbox, auth, …)
- `**src/composition-root/**` — NestJS wiring only; the single place that connects layers
- `**src/api.ts**` — entry point (HTTP API + in-process outbox relay)

```
src/
├── api.ts
├── composition-root/
├── modules/<context>/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
└── shared-kernel/<slice>/
```

[dependency-cruiser](https://github.com/sverweij/dependency-cruiser) enforces:

- No cross-context imports
- No circular dependencies
- Valid layer import direction

For conventions and scaffolding details, see [CLAUDE.md](./CLAUDE.md) and `[.claude/rules/](./.claude/rules/)`.

## Example bounded context: Quote

The Quote module demonstrates:

- Aggregates and value objects
- Domain events
- Commands and queries (CQRS)
- Repository ports and Drizzle adapters
- Transactional outbox publishing

Use it as a template when adding new bounded contexts.

## Local development

```bash
# Start infrastructure
pnpm docker:up

# Stop infrastructure
docker compose down
```

## API documentation

Export the OpenAPI specification:

```bash
pnpm openapi:export
```

Interactive docs (with the API running): [http://localhost:3000/docs](http://localhost:3000/docs)

## Quality and tooling


| Tool                                                                 | Role                                      |
| -------------------------------------------------------------------- | ----------------------------------------- |
| [Biome](https://biomejs.dev/)                                        | Linting and formatting                    |
| [Knip](https://knip.dev/)                                            | Dead code and unused dependency detection |
| [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) | Architecture rule validation              |
| [Vitest](https://vitest.dev/)                                        | Unit and integration tests                |
| TypeScript (strict)                                                  | Type safety                               |


Pre-commit hooks (Husky) and CI run the same checks. See `[.claude/rules/workflow/checks.md](./.claude/rules/workflow/checks.md)`.

