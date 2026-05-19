import { ValueObject } from "@/shared-kernel/building-blocks/domain/value-objects/value-object";
import { ValidationDomainError } from "@/shared-kernel/errors/domain/domain.error";

type TCurrencyValue = "EUR" | "USD";

const ALLOWED_CURRENCIES: readonly TCurrencyValue[] = ["EUR", "USD"];

export class Currency extends ValueObject<TCurrencyValue> {
	private constructor(value: TCurrencyValue) {
		super(value);
	}

	public static eur(): Currency {
		return new Currency("EUR");
	}

	public static usd(): Currency {
		return new Currency("USD");
	}

	public static fromString(raw: string): Currency {
		const normalized = raw.trim().toUpperCase();
		if (!ALLOWED_CURRENCIES.includes(normalized as TCurrencyValue)) {
			throw new ValidationDomainError("Unsupported currency", {
				allowed: ALLOWED_CURRENCIES,
				value: raw,
			});
		}
		return new Currency(normalized as TCurrencyValue);
	}
}
