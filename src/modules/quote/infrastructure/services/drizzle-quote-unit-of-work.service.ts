import { QuoteCommandDrizzleRepository } from "@/modules/quote/infrastructure/repositories/quote-command.drizzle-repository";
import { OutboxDrizzleRepository } from "@/shared-kernel/outbox/infrastructure/repositories/outbox.drizzle-repository";
import type {
	IQuoteUnitOfWorkContext,
	QuoteUnitOfWorkService,
} from "@/modules/quote/domain/services/quote-unit-of-work.service";
import type { CorrelationContextService } from "@/shared-kernel/correlation/domain/services/correlation-context.service";
import type { TransactionRunner } from "@/shared-kernel/database/infrastructure/services/transaction-runner.service";
import type { IdService } from "@/shared-kernel/id/domain/services/id.service";

export class DrizzleQuoteUnitOfWorkService implements QuoteUnitOfWorkService {
	public constructor(
		private readonly _transactionRunner: TransactionRunner,
		private readonly _idService: IdService,
		private readonly _correlation: CorrelationContextService,
	) {}

	public execute<TResult>(callback: (context: IQuoteUnitOfWorkContext) => Promise<TResult>): Promise<TResult> {
		return this._transactionRunner.run((tx) => {
			const context: IQuoteUnitOfWorkContext = {
				outbox: new OutboxDrizzleRepository(tx, this._idService, this._correlation),
				quote: new QuoteCommandDrizzleRepository(tx),
			};

			return callback(context);
		});
	}
}
