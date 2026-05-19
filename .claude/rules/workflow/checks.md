# Checks

## What

Ce qui valide le code avant merge. 5 outils automatisés (Biome, dependency-cruiser, knip, tsc, Vitest) orchestrés par `pnpm` scripts, déclenchés via le `husky commit-msg` hook en local et via `.github/workflows/ci.yml` en CI. Les règles automatisées ont priorité sur les règles écrites : si Biome/depcruise/knip échouent, le commit est bloqué.

## Do

- **`pnpm check`** (Biome) — lint + format + naming conventions + import sort. Config : `biome.json`. Règles strictes notables : `noExplicitAny`, `noMagicNumbers`, `noProcessEnv`, `useMaxParams: 5`, `noExcessiveLinesPerFunction: 50`, `useImportType`, `useConsistentMemberAccessibility`. Auto-fix via `pnpm check:fix`.
- **`pnpm arch`** (dependency-cruiser) — layering + cross-context + cycles. Config : `.dependency-cruiser.json`. Règles enforced :
  - `domain/` framework-agnostic (pas de `@nestjs/*`, `drizzle-orm`, `process.env`).
  - Layering `presentation → application → domain ← infrastructure` respecté.
  - Pas d'import cross-context (`modules/<a>` → `modules/<b>`).
  - Pas de fichiers hors des 4 layer folders sous `modules/<context>/`.
  - Pas de cycle, pas de `../` imports.
- **`pnpm dead`** (knip) — unused files/exports/types/deps. Config : `knip.json`. Whitelist minimale : `husky` (invoqué via hooks, pas d'import) et `dot` (binaire système utilisé par `pnpm arch:graph`).
- **`pnpm tsc`** — type check strict (no emit). Config : `tsconfig.json` avec `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`, `useUnknownInCatchVariables`.
- **`pnpm test`** (Vitest) — unit + integration. Config : `vitest.config.ts`. Tests colocalisés dans `__tests__/` (cf. `../tech/testing.md`).
- **Husky `commit-msg` hook** (`.husky/commit-msg`) — lance à chaque commit :
  1. `commitlint --edit $1` (format du message).
  2. `pnpm run check` (Biome).
  3. `pnpm run arch` (dependency-cruiser).
  4. `pnpm run dead` (knip).
  5. `pnpm run build` (nest build).
  6. `pnpm run --filter api openapi:export` (régénère `openapi.json`).
- **CI** (`.github/workflows/ci.yml`) — rejoue check + arch + dead + test (+ build docker si wiré).

## Don't

- `--no-verify` sur `git commit` ou `git push` sans commentaire d'incident expliquant pourquoi et ce qu'il faut corriger après.
- Ignorer une `rule` Biome avec `// biome-ignore` sans commentaire justifiant pourquoi ("false positive", "runs before Nest bootstrap", etc.).
- Désactiver un `match` dependency-cruiser (`severity: "ignore"`) sans justifier — c'est la règle d'archi qui se relâche.
- Whitelister dans `knip.json` (`ignoreDependencies`, `ignoreBinaries`) sans raison documentée.
- Commenter un test avec `it.skip` / `it.only` et committer — bloqué par Biome (`noSkippedTests`, `noFocusedTests`).
- Laisser un `process.env.FOO` direct sans `// biome-ignore lint/style/noProcessEnv` + raison — Biome bloque (`noProcessEnv`).
- Laisser une migration Drizzle hand-edited sans commentaire d'intention (rename, renommage de colonne).

## Example

**Husky hook** — `.husky/commit-msg` :

```sh
#!/usr/bin/env sh
npx --no-install commitlint --edit "$1"

pnpm run check
pnpm run arch
pnpm run dead
pnpm run build

echo "🔧 Export OpenAPI…"
pnpm run --filter api openapi:export
```

**Biome config** — `biome.json` :

- `formatter.lineWidth: 120`
- `linter.rules.style.useMaxParams.max: 5`
- `linter.rules.style.noMagicNumbers: error`
- `linter.rules.suspicious.noSkippedTests: error`
- `files.includes` exclut `drizzle/`, `dist/`, `node_modules/`, `openapi.json`, `.claude/settings.local.json`.

**Depcruise config** — `.dependency-cruiser.json` :

- Rule `domain-must-be-pure` : interdit d'importer `@nestjs/*`, `drizzle-orm`, `pg`, `@aws-sdk/*`, `class-validator` depuis `domain/`.
- Rule `cross-context-forbidden` : interdit `modules/$1/ → modules/!$1/`.
- Rule `modules-must-live-in-layers` : interdit les fichiers hors `domain/|application/|infrastructure/|presentation/` sous `modules/<context>/`.

**Knip config** — `knip.json` :

```json
{
    "entry": ["src/api.ts", "src/core/app/presentation/commands/openapi-export.command.ts"],
    "ignoreBinaries": ["dot"],
    "ignoreDependencies": ["husky"],
    "project": ["src/**/*.ts"]
}
```

## See also

- [`commits.md`](./commits.md) — atomic commits : chaque commit doit passer **tous** ces checks seul.
- [`../tech/testing.md`](../tech/testing.md) — ce que `pnpm test` exécute par layer.
- [`../tech/clean-architecture.md`](../tech/clean-architecture.md) — règles de layer/import que `pnpm arch` enforce.
- `biome.json`, `.dependency-cruiser.json`, `knip.json`, `tsconfig.json` — source de vérité.
