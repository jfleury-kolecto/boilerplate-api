import { Quote } from "@/modules/quote/domain/aggregates/quote.aggregate";
import { QuoteCreated } from "@/modules/quote/domain/events/quote-created.event";
import { QuoteSent } from "@/modules/quote/domain/events/quote-sent.event";
import { EmailRecipient } from "@/modules/quote/domain/value-objects/email-recipient.vo";
import { ValidationDomainError } from "@/shared-kernel/errors/domain/domain.error";

const QUOTE_ID = "019ad951-368a-7de5-b7ba-add19cfd187b";
const LINE_ID = "019be5e6-c357-733b-8857-25fef291279e";
const CUSTOMER_ID = "019be5e6-c357-733b-8857-25fef291279f";

describe("Quote aggregate", () => {
	it("records a QuoteCreated event on factory create", () => {
		// Arrange + Act
		const quote = Quote.create({
			currency: "EUR",
			customerId: CUSTOMER_ID,
			id: QUOTE_ID,
			lines: [{ description: "A", id: LINE_ID, quantity: 3, unitPriceCents: 10_000 }],
		});

		// Assert
		const events = quote.pullEvents();
		expect(events).toHaveLength(1);
		expect(events[0]).toBeInstanceOf(QuoteCreated);
		expect(quote.status.isDraft()).toBe(true);
		expect(quote.totalAmount().amountInCents).toBe(30_000);
	});

	it("refuses to create a quote with no lines", () => {
		// Act + Assert
		expect(() =>
			Quote.create({
				currency: "EUR",
				customerId: CUSTOMER_ID,
				id: QUOTE_ID,
				lines: [],
			}),
		).toThrow(ValidationDomainError);
	});

	it("records QuoteSent with the total when sending a draft quote", () => {
		// Arrange
		const quote = Quote.create({
			currency: "EUR",
			customerId: CUSTOMER_ID,
			id: QUOTE_ID,
			lines: [{ description: "A", id: LINE_ID, quantity: 2, unitPriceCents: 5_000 }],
		});
		quote.pullEvents(); // clear QuoteCreated

		// Act
		quote.send(EmailRecipient.fromString("buyer@example.com"));

		// Assert
		const events = quote.pullEvents();
		expect(events).toHaveLength(1);
		const sent = events[0] as QuoteSent;
		expect(sent).toBeInstanceOf(QuoteSent);
		expect(sent.totalAmountCents).toBe(10_000);
		expect(sent.currency).toBe("EUR");
		expect(sent.recipient).toBe("buyer@example.com");
		expect(quote.status.isSent()).toBe(true);
	});
});
