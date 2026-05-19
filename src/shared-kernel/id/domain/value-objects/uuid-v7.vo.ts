import { ValueObject } from "@/shared-kernel/building-blocks/domain/value-objects/value-object";
import { ValidationDomainError } from "@/shared-kernel/errors/domain/domain.error";

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class UuidV7 extends ValueObject<string> {
	private constructor(value: string) {
		super(value);
	}

	public static fromString(raw: string): UuidV7 {
		if (!UUID_V7_PATTERN.test(raw)) {
			throw new ValidationDomainError("Invalid UUID v7", { value: raw });
		}
		return new UuidV7(raw);
	}
}
