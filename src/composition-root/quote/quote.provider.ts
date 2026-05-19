import type { Provider } from "@nestjs/common";

import { AcceptQuoteCommand } from "@/modules/quote/application/commands/accept-quote.command";
import { CreateQuoteCommand } from "@/modules/quote/application/commands/create-quote.command";
import { RejectQuoteCommand } from "@/modules/quote/application/commands/reject-quote.command";
import { SendQuoteCommand } from "@/modules/quote/application/commands/send-quote.command";
import { GetQuoteQuery } from "@/modules/quote/application/queries/get-quote.query";
import { GetQuoteSummaryQuery } from "@/modules/quote/application/queries/get-quote-summary.query";
import { QuoteQueryDrizzleRepository } from "@/modules/quote/infrastructure/repositories/quote-query.drizzle-repository";
import { DrizzleQuoteUnitOfWorkService } from "@/modules/quote/infrastructure/services/drizzle-quote-unit-of-work.service";
import {
	ACCEPT_QUOTE_COMMAND_TOKEN,
	CREATE_QUOTE_COMMAND_TOKEN,
	GET_QUOTE_QUERY_TOKEN,
	GET_QUOTE_SUMMARY_QUERY_TOKEN,
	QUOTE_QUERY_REPOSITORY_TOKEN,
	QUOTE_UNIT_OF_WORK_SERVICE_TOKEN,
	REJECT_QUOTE_COMMAND_TOKEN,
	SEND_QUOTE_COMMAND_TOKEN,
} from "@/modules/quote/presentation/dependency-injection/quote.token";
import { CorrelationContextService } from "@/shared-kernel/correlation/domain/services/correlation-context.service";
import {
	DRIZZLE_SERVICE_TOKEN,
	TRANSACTION_RUNNER_TOKEN,
} from "@/shared-kernel/database/presentation/dependency-injection/database.token";
import { ID_SERVICE_TOKEN } from "@/shared-kernel/id/presentation/dependency-injection/uuid.token";
import type { QuoteQueryRepository } from "@/modules/quote/domain/repositories/quote-query.repository";
import type { QuoteUnitOfWorkService } from "@/modules/quote/domain/services/quote-unit-of-work.service";
import type { DrizzleService } from "@/shared-kernel/database/infrastructure/services/drizzle.service";
import type { TransactionRunner } from "@/shared-kernel/database/infrastructure/services/transaction-runner.service";
import type { IdService } from "@/shared-kernel/id/domain/services/id.service";

export const QUOTE_QUERY_REPOSITORY_PROVIDER: Provider<QuoteQueryRepository> = {
	inject: [DRIZZLE_SERVICE_TOKEN],
	provide: QUOTE_QUERY_REPOSITORY_TOKEN,
	useFactory: (drizzle: DrizzleService) => new QuoteQueryDrizzleRepository(drizzle.db),
};

export const QUOTE_UNIT_OF_WORK_SERVICE_PROVIDER: Provider<QuoteUnitOfWorkService> = {
	inject: [TRANSACTION_RUNNER_TOKEN, ID_SERVICE_TOKEN, CorrelationContextService],
	provide: QUOTE_UNIT_OF_WORK_SERVICE_TOKEN,
	useFactory: (transactionRunner: TransactionRunner, idService: IdService, correlation: CorrelationContextService) =>
		new DrizzleQuoteUnitOfWorkService(transactionRunner, idService, correlation),
};

export const CREATE_QUOTE_COMMAND_PROVIDER: Provider<CreateQuoteCommand> = {
	inject: [ID_SERVICE_TOKEN, QUOTE_UNIT_OF_WORK_SERVICE_TOKEN],
	provide: CREATE_QUOTE_COMMAND_TOKEN,
	useFactory: (idService: IdService, unitOfWork: QuoteUnitOfWorkService) =>
		new CreateQuoteCommand(idService, unitOfWork),
};

export const SEND_QUOTE_COMMAND_PROVIDER: Provider<SendQuoteCommand> = {
	inject: [QUOTE_UNIT_OF_WORK_SERVICE_TOKEN],
	provide: SEND_QUOTE_COMMAND_TOKEN,
	useFactory: (unitOfWork: QuoteUnitOfWorkService) => new SendQuoteCommand(unitOfWork),
};

export const ACCEPT_QUOTE_COMMAND_PROVIDER: Provider<AcceptQuoteCommand> = {
	inject: [QUOTE_UNIT_OF_WORK_SERVICE_TOKEN],
	provide: ACCEPT_QUOTE_COMMAND_TOKEN,
	useFactory: (unitOfWork: QuoteUnitOfWorkService) => new AcceptQuoteCommand(unitOfWork),
};

export const REJECT_QUOTE_COMMAND_PROVIDER: Provider<RejectQuoteCommand> = {
	inject: [QUOTE_UNIT_OF_WORK_SERVICE_TOKEN],
	provide: REJECT_QUOTE_COMMAND_TOKEN,
	useFactory: (unitOfWork: QuoteUnitOfWorkService) => new RejectQuoteCommand(unitOfWork),
};

export const GET_QUOTE_QUERY_PROVIDER: Provider<GetQuoteQuery> = {
	inject: [QUOTE_QUERY_REPOSITORY_TOKEN],
	provide: GET_QUOTE_QUERY_TOKEN,
	useFactory: (repository: QuoteQueryRepository) => new GetQuoteQuery(repository),
};

export const GET_QUOTE_SUMMARY_QUERY_PROVIDER: Provider<GetQuoteSummaryQuery> = {
	inject: [QUOTE_QUERY_REPOSITORY_TOKEN],
	provide: GET_QUOTE_SUMMARY_QUERY_TOKEN,
	useFactory: (repository: QuoteQueryRepository) => new GetQuoteSummaryQuery(repository),
};
