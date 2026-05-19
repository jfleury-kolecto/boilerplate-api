import { QuoteStatus } from "@/modules/quote/domain/value-objects/quote-status.vo";
import { InvalidTransitionDomainError } from "@/shared-kernel/errors/domain/domain.error";

describe("QuoteStatus", () => {
	it("transitions from draft to sent via send()", () => {
		// Arrange
		const draft = QuoteStatus.draft();

		// Act
		const sent = draft.send();

		// Assert
		expect(sent.isSent()).toBe(true);
		expect(draft.isDraft()).toBe(true); // original is immutable
	});

	it("accepts a sent quote", () => {
		// Arrange
		const sent = QuoteStatus.sent();

		// Act
		const accepted = sent.accept();

		// Assert
		expect(accepted.value).toBe("accepted");
	});

	it("refuses to accept a draft quote", () => {
		// Arrange
		const draft = QuoteStatus.draft();

		// Act + Assert
		expect(() => draft.accept()).toThrow(InvalidTransitionDomainError);
	});
});
