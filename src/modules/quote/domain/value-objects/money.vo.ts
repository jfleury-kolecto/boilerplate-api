import { ValueObject } from "@/shared-kernel/building-blocks/domain/value-objects/value-object";
import { InvalidTransitionDomainError, ValidationDomainError } from "@/shared-kernel/errors/domain/domain.error";
import type { Currency } from "@/modules/quote/domain/value-objects/currency.vo";

interface IMoneyValue {
	readonly amountInCents: number;
	readonly currency: Currency;
}

interface IMoneyJson {
	amountInCents: number;
	currency: string;
}

export class Money extends ValueObject<IMoneyValue> {
	private constructor(value: IMoneyValue) {
		super(value);
	}

	public static of(amountInCents: number, currency: Currency): Money {
		if (!Number.isInteger(amountInCents)) {
			throw new ValidationDomainError("Money amount must be an integer (cents)", { value: amountInCents });
		}
		return new Money({ amountInCents, currency });
	}

	public static zero(currency: Currency): Money {
		return Money.of(0, currency);
	}

	public get amountInCents(): number {
		return this._value.amountInCents;
	}

	public get currency(): Currency {
		return this._value.currency;
	}

	public add(other: Money): Money {
		this._assertSameCurrency(other);
		return new Money({
			amountInCents: this._value.amountInCents + other._value.amountInCents,
			currency: this._value.currency,
		});
	}

	public multiply(factor: number): Money {
		if (!Number.isInteger(factor)) {
			throw new ValidationDomainError("Money.multiply requires an integer factor", { value: factor });
		}
		return new Money({
			amountInCents: this._value.amountInCents * factor,
			currency: this._value.currency,
		});
	}

	public override equals(other: ValueObject<IMoneyValue>): boolean {
		if (!(other instanceof Money)) return false;
		return (
			this._value.amountInCents === other._value.amountInCents &&
			this._value.currency.equals(other._value.currency)
		);
	}

	public toJson(): IMoneyJson {
		return { amountInCents: this._value.amountInCents, currency: this._value.currency.value };
	}

	private _assertSameCurrency(other: Money): void {
		if (!this._value.currency.equals(other._value.currency)) {
			throw new InvalidTransitionDomainError("Cannot combine Money values with different currencies", {
				left: this._value.currency.value,
				right: other._value.currency.value,
			});
		}
	}
}
