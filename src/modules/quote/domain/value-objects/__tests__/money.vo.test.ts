import { Currency } from "@/modules/quote/domain/value-objects/currency.vo";
import { Money } from "@/modules/quote/domain/value-objects/money.vo";
import { InvalidTransitionDomainError, ValidationDomainError } from "@/shared-kernel/errors/domain/domain.error";

describe("Money", () => {
	it("adds two values sharing the same currency", () => {
		// Arrange
		const a = Money.of(10_000, Currency.eur());
		const b = Money.of(5_000, Currency.eur());

		// Act
		const result = a.add(b);

		// Assert
		expect(result.amountInCents).toBe(15_000);
		expect(result.currency.value).toBe("EUR");
	});

	it("rejects addition with different currencies", () => {
		// Arrange
		const inEuro = Money.of(1_000, Currency.eur());
		const inDollar = Money.of(1_000, Currency.usd());

		// Act + Assert
		expect(() => inEuro.add(inDollar)).toThrow(InvalidTransitionDomainError);
	});

	it("multiplies by an integer factor keeping the currency", () => {
		// Arrange
		const unitPrice = Money.of(2_500, Currency.eur());

		// Act
		const total = unitPrice.multiply(4);

		// Assert
		expect(total.amountInCents).toBe(10_000);
		expect(total.currency.value).toBe("EUR");
	});

	it("rejects non-integer amounts at construction", () => {
		// Arrange
		const fractionalCents = 100.5;

		// Act + Assert
		expect(() => Money.of(fractionalCents, Currency.eur())).toThrow(ValidationDomainError);
	});
});
