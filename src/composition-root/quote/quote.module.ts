import { Module } from "@nestjs/common";

import { CorrelationModule } from "@/composition-root/correlation/correlation.module";
import { DatabaseModule } from "@/composition-root/database/database.module";
import { UuidModule } from "@/composition-root/id/uuid.module";
import {
	ACCEPT_QUOTE_COMMAND_PROVIDER,
	CREATE_QUOTE_COMMAND_PROVIDER,
	GET_QUOTE_QUERY_PROVIDER,
	GET_QUOTE_SUMMARY_QUERY_PROVIDER,
	QUOTE_QUERY_REPOSITORY_PROVIDER,
	QUOTE_UNIT_OF_WORK_SERVICE_PROVIDER,
	REJECT_QUOTE_COMMAND_PROVIDER,
	SEND_QUOTE_COMMAND_PROVIDER,
} from "@/composition-root/quote/quote.provider";
import { QuoteCommandController } from "@/modules/quote/presentation/controllers/quote-command.controller";
import { QuoteQueryController } from "@/modules/quote/presentation/controllers/quote-query.controller";

@Module({
	controllers: [QuoteCommandController, QuoteQueryController],
	exports: [],
	imports: [UuidModule, DatabaseModule, CorrelationModule],
	providers: [
		QUOTE_QUERY_REPOSITORY_PROVIDER,
		QUOTE_UNIT_OF_WORK_SERVICE_PROVIDER,
		CREATE_QUOTE_COMMAND_PROVIDER,
		SEND_QUOTE_COMMAND_PROVIDER,
		ACCEPT_QUOTE_COMMAND_PROVIDER,
		REJECT_QUOTE_COMMAND_PROVIDER,
		GET_QUOTE_QUERY_PROVIDER,
		GET_QUOTE_SUMMARY_QUERY_PROVIDER,
	],
})
export class QuoteModule {}
