export interface IQuoteLineInput {
	id: string;
	description: string;
	quantity: number;
	unitPriceCents: number;
}

export interface ICreateQuoteCommand {
	id: string;
	customerId: string;
	currency: string;
	lines: IQuoteLineInput[];
}
