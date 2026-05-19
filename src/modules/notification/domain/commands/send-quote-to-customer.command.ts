export interface ISendQuoteToCustomerCommand {
	eventId: string;
	quoteId: string;
	totalAmountCents: number;
	currency: string;
	recipient: string;
}
