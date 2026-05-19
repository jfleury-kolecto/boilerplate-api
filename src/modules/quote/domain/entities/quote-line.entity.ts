import { Money } from "@/modules/quote/domain/value-objects/money.vo";
import { Quantity } from "@/modules/quote/domain/value-objects/quantity.vo";
import { Entity } from "@/shared-kernel/building-blocks/domain/entities/entity";
import { ValidationDomainError } from "@/shared-kernel/errors/domain/domain.error";
import { UuidV7 } from "@/shared-kernel/id/domain/value-objects/uuid-v7.vo";
import type { IQuoteLineInput } from "@/modules/quote/domain/commands/create-quote.command";
import type { IQuoteLinePrimitives } from "@/modules/quote/domain/primitives/quote.primitives";
import type { Currency } from "@/modules/quote/domain/value-objects/currency.vo";

export class QuoteLine extends Entity<UuidV7> {
	private static readonly _MAX_DESCRIPTION_LENGTH = 500;

	private readonly _description: string;
	private readonly _quantity: Quantity;
	private readonly _unitPrice: Money;

	private constructor(id: UuidV7, description: string, quantity: Quantity, unitPrice: Money) {
		super(id);
		this._description = description;
		this._quantity = quantity;
		this._unitPrice = unitPrice;
	}

	public static create(command: IQuoteLineInput, currency: Currency): QuoteLine {
		const trimmed = command.description.trim();
		if (trimmed.length === 0) {
			throw new ValidationDomainError("QuoteLine description cannot be empty");
		}
		if (trimmed.length > QuoteLine._MAX_DESCRIPTION_LENGTH) {
			throw new ValidationDomainError("QuoteLine description is too long", {
				max: QuoteLine._MAX_DESCRIPTION_LENGTH,
				received: trimmed.length,
			});
		}

		return new QuoteLine(
			UuidV7.fromString(command.id),
			trimmed,
			Quantity.of(command.quantity),
			Money.of(command.unitPriceCents, currency),
		);
	}

	public static fromPrimitives(primitives: IQuoteLinePrimitives, currency: Currency): QuoteLine {
		return new QuoteLine(
			UuidV7.fromString(primitives.id),
			primitives.description,
			Quantity.of(primitives.quantity),
			Money.of(primitives.unitPriceCents, currency),
		);
	}

	public get description(): string {
		return this._description;
	}

	public get quantity(): Quantity {
		return this._quantity;
	}

	public get unitPrice(): Money {
		return this._unitPrice;
	}

	public lineTotal(): Money {
		return this._unitPrice.multiply(this._quantity.value);
	}

	public toPrimitives(): IQuoteLinePrimitives {
		return {
			description: this._description,
			id: this.id.value,
			quantity: this._quantity.value,
			unitPriceCents: this._unitPrice.amountInCents,
		};
	}
}
