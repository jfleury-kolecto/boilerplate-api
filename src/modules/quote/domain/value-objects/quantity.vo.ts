import { ValueObject } from "@/shared-kernel/building-blocks/domain/value-objects/value-object";
import { ValidationDomainError } from "@/shared-kernel/errors/domain/domain.error";

export class Quantity extends ValueObject<number> {
	private static readonly _MIN = 1;

	private constructor(value: number) {
		super(value);
	}

	public static of(raw: number): Quantity {
		if (!Number.isInteger(raw)) {
			throw new ValidationDomainError("Quantity must be an integer", { value: raw });
		}
		if (raw < Quantity._MIN) {
			throw new ValidationDomainError("Quantity must be at least 1", { value: raw });
		}
		return new Quantity(raw);
	}
}
