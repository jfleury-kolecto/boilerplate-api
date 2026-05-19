# Principles — DRY, KISS, YAGNI, fail-fast, SRP

## What

5 principes de design qui orientent les choix concrets dans ce repo. Ils arbitrent les trade-offs quotidiens : quand factoriser, quand ne pas, quand throw, quand laisser couler. Chaque principe est appuyé par un exemple précis du code.

## Do

- **DRY (Don't Repeat Yourself)** — factoriser quand la duplication est **réelle et stable** : même responsabilité, même shape, même cycle de vie. Exemple : `@ApiRoute` factorise 7 décorateurs Scalar utilisés sur toutes les routes.
- **KISS (Keep It Simple, Stupid)** — préférer la solution directe. Exemple : 2 `controllers` physiques (command + query) plutôt qu'un `command bus` + registre dynamique ; un `http` natif Node pour `/healthz` plutôt qu'un serveur HTTP séparé (finalement rapatrié dans l'API via Fastify).
- **YAGNI (You Aren't Gonna Need It)** — ne coder que ce qui est utilisé maintenant. Exemple : pas de `save()` générique sur un `repository`, pas de méthode `findByCustomerId` tant qu'un `handler` ne l'appelle pas. Supprimer sans regret ce qui n'est plus wire (cf. retrait de `QuoteDiscountPreviewQuery`, `QuotePricingService`, `Percentage` quand la feature a été jugée non représentative).
- **Fail-fast** — valider au `boot` et throw à la `construction`. Exemples :
  - `EnvironmentVariablesInputDto` + `class-validator` refuse de démarrer si une env var required manque (`EVENT_BUS_NAME`, `NOTIFICATION_QUEUE_URL`, `AWS_REGION`).
  - `EventBridgePublisherService` throw dans son constructor si `EVENT_BUS_NAME` est vide — pas de fallback silencieux vers une `ConsolePublisher`.
- **SRP (Single Responsibility Principle)** — 1 fichier = 1 `public export` principal. 1 `commit` = 1 logical change. 1 `handler` = 1 intention business.

## Don't

- Factoriser à partir de 2 occurrences qui "se ressemblent" — laisser dupliquer le temps que le pattern stabilise, factoriser quand la 3ᵉ ou 4ᵉ apparaît.
- Ajouter des options spéculatives (`optional?:`, `override?:`) pour un usage qui n'existe pas encore.
- Laisser une `config fail-silent` — ex : ignorer une env var manquante et utiliser un default trompeur.
- Étaler du code domain sur plusieurs fichiers pour "séparer les responsabilités" alors qu'une seule classe traduit la réalité métier.
- Commits mixtes (`refactor` + `feature`) sous prétexte de "tant qu'on y est".
- Retenir une abstraction "au cas où" — supprimer dès qu'elle n'est plus utilisée, rajouter quand nécessaire.

## Example

**DRY** — `src/shared-kernel/http/presentation/decorators/api-route.decorator.ts` compose 7+ décorateurs Scalar en un seul `@ApiRoute({...})` typé ; supprime l'empilement répétitif sur les 8 routes du `QuoteController`.

**KISS** — `src/modules/quote/presentation/controllers/quote-{command,query}.controller.ts` : 2 classes simples au même préfixe URL, aucun `command bus` ni `@MessagePattern`.

**YAGNI** — `src/modules/quote/domain/repositories/quote-command.repository.ts` expose `findAggregateById`, `create`, `update` — rien d'autre. Pas de `findMany`, pas de `deleteById` tant qu'un `handler` ne l'appelle pas.

**Fail-fast** — `src/shared-kernel/outbox/infrastructure/services/event-bridge-publisher.service.ts` :

```ts
public constructor(configService: ConfigService) {
    super();
    this._busName = configService.get<string>("EVENT_BUS_NAME") ?? "";
    if (this._busName === "") {
        throw new Error("EVENT_BUS_NAME is not set — cannot initialize EventBridgePublisherService");
    }
    // ...
}
```

**SRP** — 1 event = 1 fichier (`src/modules/quote/domain/events/quote-sent.event.ts`, `.../quote-created.event.ts`, etc.) ; 1 `command handler` = 1 intent (`src/modules/quote/application/commands/send-quote.command.ts` ne fait que "send").

## See also

- [`clean-architecture.md`](./clean-architecture.md) — SRP appliqué à la granularité "un fichier par responsabilité".
- [`http-routes.md`](./http-routes.md) — `@ApiRoute` comme application concrète de DRY.
- [`../workflow/commits.md`](../workflow/commits.md) — SRP au niveau commit (1 commit = 1 logical change).
- [`outbox.md`](./outbox.md) — `EventBridgePublisherService` fail-fast, un seul publisher.
