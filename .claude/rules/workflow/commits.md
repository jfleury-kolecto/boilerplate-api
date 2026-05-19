# Commits

## What

Format : Conventional Commits (`<type>(<scope>): <summary>`), commits atomiques (1 commit = 1 logical change), MR cap 1000 lignes (hors lockfile / `openapi.json` / migrations). Claude suit un protocole step-by-step : split la tâche upfront, execute un step à la fois, propose un `commit message` à la fin de chaque step. La branche locale est rebase-mergée quand possible pour conserver l'historique atomique.

## Do

- **Format Conventional Commits** :
  ```
  <type>(<scope>): <summary>

  <body optionnel — explique le pourquoi, wrap à 72 chars>

  <footer optionnel — BREAKING CHANGE:, Refs: #123>
  ```
- **Types autorisés** (par fréquence) : `feat` | `fix` | `refactor` | `test` | `docs` | `chore` | `perf` | `build` | `ci` | `revert`.
- **Scope** : lowercase, kebab-case. Typiquement le `bounded context` ou le concern (`quote`, `outbox`, `core`, `drizzle`, `biome`, `rules`). Omis uniquement si vraiment global.
- **Summary** : impératif ("add", "fix", "rename" — pas "added"), minuscule après le colon, sans point final, ≤ 72 chars.
- **Body** : ligne vide entre summary et body, wrap 72 chars. Explique **pourquoi** le changement, pas le diff.
- **Atomic commits** — chaque commit doit :
  - Build, lint, typecheck, passer les tests **seul** (`pnpm tsc && pnpm check && pnpm arch && pnpm dead && pnpm test`).
  - Être revertable sans casser d'autres choses.
  - Avoir un message qui capture **une** intention.
- **MR cap 1000 lignes** — ajoutés + supprimés, hors `pnpm-lock.yaml`, `openapi.json`, migrations `drizzle/*.sql`. Au-dessus : split en plusieurs MRs.
- **Protocole Claude** :
  1. Avant de coder, lister les commits prévus comme une suite numérotée (chacun avec un titre Conventional Commits).
  2. Exécuter un step à la fois, run les checks, propose le message à la fin. Ne jamais enchaîner deux steps.
  3. Si un step dépasse ~300 lines, pause et split.
  4. Si un step découvre un problème non-lié, surface-le comme step séparé — pas de bundle.
- **Rebase** local sur `main`/`develop` avant d'ouvrir la MR. Rebase-merge (ou fast-forward) préféré au squash quand les commits sont bien découpés.

## Don't

- Mixer dans un même commit :
  - `refactor` + `feature`
  - `feat` + `fix` non lié
  - `config` + `business logic`
  - `formatting` + substance
- Messages opaques : `WIP`, `fix`, `stuff`, `update`, `more changes`, `fixes`.
- Body qui raconte le diff ("added line 42", "changed import X").
- `squash-merge` d'une branche qui a des commits atomiques bien faits — ça détruit l'historique.
- `git rebase -i` ou `git add -i` — flags interactifs forbidden (non-supportés par le harness).
- `git rebase --no-edit` — `--no-edit` n'est pas un flag valide pour rebase.
- `--no-verify` sur `commit` ou `push` sans commentaire d'incident expliquant pourquoi.
- Commit en français quand la convention repo est l'anglais — les messages commit restent en anglais ici.
- Amender un commit pour cacher une erreur — faire un nouveau commit qui corrige.

## Example

**Bons messages** :

```
feat(outbox): version domain event payloads via toPayload()

DomainEvent now exposes an abstract toPayload() that returns
{ version, data }. IEventPayload is generic on the data shape so
concrete events narrow the return type to their specific fields
instead of leaking Record<string, unknown>. OutboxDrizzleRepository.
enqueue stores event.toPayload() instead of the previous cast.
```

```
refactor(quote): split repository into command and query ports

The merged QuoteRepository used to return IQuoteView from findById
and feed it back into Quote.fromPrimitives. It only worked because
IQuoteView is structurally a superset of IQuotePrimitives — a time
bomb. Two ports now: QuoteCommandRepository (findAggregateById
returns Quote) and QuoteQueryRepository (findById returns IQuoteView).
```

```
fix(localstack): pin default region to eu-west-1

Without AWS_DEFAULT_REGION the init script creates the "events"
queue under the LocalStack default (us-east-1), and the app — with
AWS_REGION=eu-west-1 — hits QueueDoesNotExist on every publish.
```

**Mauvais messages** :

```
fix: stuff
update quote.ts and controller
feat(quote): add GetQuoteQuery and GetQuoteSummaryQuery and fix a typo and rename the status enum
WIP
```

**Commits récents du repo** (référence) :

```
bbaa7cc refactor(outbox): drop per-tick and per-event relay logs
a7120c2 chore(localstack): allow CORS from app.localstack.cloud
8ff23e0 refactor(logging): rewrite RequestLoggerMiddleware to one-liner per request
2f85003 fix(localstack): pin default region to eu-west-1
ed28d0c docs: drop docs/ and consolidate into README.md and .claude/
```

## See also

- [`checks.md`](./checks.md) — ce qui tourne dans le `husky commit-msg` hook avant chaque commit.
- [`../tech/principles.md`](../tech/principles.md) — SRP au niveau commit (1 commit = 1 responsabilité).
