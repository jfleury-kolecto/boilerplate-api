# Clean Architecture

## What

Le code suit les couches Clean Architecture : `presentation → application → domain ← infrastructure`. Les dépendances pointent toujours vers l'intérieur. Chaque `bounded context` dans `src/modules/<context>/` a exactement les 4 layer folders (`domain/`, `application/`, `infrastructure/`, `presentation/`). La wire-up Nest (providers + `@Module`) vit dans une **composition root** unique (`src/composition-root/`) — 5ᵉ racine hors des 4 layers, seul endroit autorisé à câbler des adapters concrets avec des handlers et controllers (pattern canonique de Mark Seemann / Robert C. Martin "Main"). Les règles sont enforced par `dependency-cruiser` (`pnpm arch`), strictement et sans `pathNot` carve-out à l'intérieur des layers.

## Do

- Placer chaque fichier dans le layer correspondant à son rôle — un `handler` dans `application/`, un `controller` dans `presentation/`, un `Drizzle repository` dans `infrastructure/`, un `aggregate` / `value object` / `entity` / `event` / `port` dans `domain/`.
- Pour un nouveau `bounded context`, recopier le scaffold template (section **Example**) tel quel + ajouter un dossier sous `src/composition-root/<slice>/`.
- Dans `application/`, n'importer que du `domain/` de son propre `bounded context` et des `core/*/domain/*` partagés.
- Dans `infrastructure/`, implémenter les `ports` du `domain/`. Aucun import vers `application/` ou `presentation/`.
- Dans `presentation/`, n'importer que des `handlers` application et les DI `tokens` (de son propre `presentation/dependency-injection/`).
- Dans `src/composition-root/`, câbler `application/` (handlers) + `infrastructure/` (adapters Drizzle / services) + `presentation/dependency-injection/` (tokens). C'est le **seul** endroit qui voit toutes les couches.

## Don't

- Créer un dossier hors des 4 layers sous `modules/<context>/` (enforced par `dependency-cruiser`, erreur bloquante).
- Importer un autre `bounded context` depuis `modules/<context>/` — chaque contexte est isolé.
- Importer `drizzle-orm` / `DrizzleService` / `@nestjs/*` depuis `domain/` ou `application/`.
- Utiliser un chemin relatif `../` — tout passe par l'alias `@/` (enforced par Biome + depcruise).
- Mettre du business logic dans un `controller` ou un `Drizzle repository` — tout descend vers `domain/` ou remonte via un `handler` application.
- Importer `src/composition-root/` depuis n'importe quel layer (`domain/`, `application/`, `infrastructure/`, `presentation/`) — la composition root dépend des layers, jamais l'inverse (règle `layers-no-composition-root`).
- Mettre un `provider` ou un `@Module` ailleurs que dans `src/composition-root/` — pas de wire-up à l'intérieur d'un bounded context.

## Example

Scaffold complet à reproduire pour chaque nouveau `bounded context` :

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
    services/         <name>.service.ts                    (adapters concrets)
  presentation/
    controllers/      <aggregate>-command.controller.ts            (REST writes)
                      <aggregate>-query.controller.ts              (REST reads)
                      <context>-<event>.event-controller.ts        (SQS subscriber, optional)
    dependency-injection/
                      <aggregate>.token.ts                 (Symbol tokens)
    dto/
      inputs/         <verb>-<aggregate>.input-dto.ts              (HTTP request body)
      outputs/        <aggregate>.output-dto.ts                    (HTTP response body)
      events/         <event>.event-dto.ts                          (inbound SQS event, optional)
    mappers/          <aggregate>-output-dto.mappers.ts
    <aggregate>.api.ts                                     (tag + param constants)

src/composition-root/<slice>/                              (5ᵉ racine, hors layers)
  <aggregate>.module.ts                                    (@Module : controllers + providers + imports)
  <aggregate>.provider.ts                                  (factory providers : useFactory câble adapter + handler)
```

Le contexte de référence : `src/modules/quote/` + `src/composition-root/quote/`.

## Règles `dependency-cruiser`

- `domain-must-be-pure`, `domain-no-upper-layers` — domain n'importe que TS pur.
- `application-no-infra-or-presentation`, `application-no-drizzle` — application n'importe que `domain/`.
- `infrastructure-no-app-or-presentation` — infrastructure n'importe que `domain/`. Plus aucun `pathNot` carve-out.
- `presentation-no-infrastructure` — presentation n'importe que `application/` et son propre `presentation/`. Plus aucun `pathNot` carve-out.
- `layers-no-composition-root` — aucun layer (`domain` / `application` / `infrastructure` / `presentation`) ne dépend de `src/composition-root/`.
- `cross-context-forbidden` — un `bounded context` ne dépend pas d'un autre.
- `modules-must-live-in-layers` — fichiers sous `src/modules/<x>/` sont confinés aux 4 layers.

## See also

- [`ddd.md`](./ddd.md) — building blocks (`aggregate`, `value object`, `entity`, `event`, `domain service`, `domain error`).
- [`cqrs.md`](./cqrs.md) — séparation `command` / `query` (controllers + repositories).
- [`dependency-injection.md`](./dependency-injection.md) — composition root unique, `factory providers`, `Symbol tokens`.
- `.dependency-cruiser.json` — source de vérité sur les règles d'import enforced.
