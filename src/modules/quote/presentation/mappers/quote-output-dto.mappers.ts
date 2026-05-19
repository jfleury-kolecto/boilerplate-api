import type { Quote } from "@/modules/quote/domain/aggregates/quote.aggregate";
import type { QuoteOutputDto } from "@/modules/quote/presentation/dto/outputs/quote.output-dto";

export class QuoteOutputDtoMappers {
	public static fromAggregate(quote: Quote): QuoteOutputDto {
		return {
			currency: quote.currency.value,
			customerId: quote.customerId.value,
			id: quote.id.value,
			lines: quote.lines.map((line) => ({
				description: line.description,
				id: line.id.value,
				lineTotalCents: line.lineTotal().amountInCents,
				quantity: line.quantity.value,
				unitPriceCents: line.unitPrice.amountInCents,
			})),
			status: quote.status.value,
			totalAmountCents: quote.totalAmount().amountInCents,
		};
	}
}
