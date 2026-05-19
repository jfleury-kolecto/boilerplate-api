export interface IQuoteLinePrimitives {
	id: string;
	description: string;
	quantity: number;
	unitPriceCents: number;
}

export interface IQuotePrimitives {
	id: string;
	customerId: string;
	currency: string;
	status: string;
	lines: IQuoteLinePrimitives[];
}
