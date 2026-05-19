import type { QuoteCommandRepository } from "@/modules/quote/domain/repositories/quote-command.repository";
import type { OutboxRepository } from "@/shared-kernel/outbox/domain/repositories/outbox.repository";

export interface IQuoteUnitOfWorkContext {
	readonly outbox: OutboxRepository;
	readonly quote: QuoteCommandRepository;
}

export abstract class QuoteUnitOfWorkService {
	public abstract execute<TResult>(
		callback: (context: IQuoteUnitOfWorkContext) => Promise<TResult>,
	): Promise<TResult>;
}
