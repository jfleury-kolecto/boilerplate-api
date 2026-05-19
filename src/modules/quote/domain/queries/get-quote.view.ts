interface IQuoteLineView {
	id: string;
	description: string;
	quantity: number;
	unitPriceCents: number;
	lineTotalCents: number;
}

export interface IQuoteView {
	id: string;
	customerId: string;
	currency: string;
	status: string;
	lines: IQuoteLineView[];
	totalAmountCents: number;
}
