import { ValueObject } from "@/shared-kernel/building-blocks/domain/value-objects/value-object";
import { ValidationDomainError } from "@/shared-kernel/errors/domain/domain.error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailRecipient extends ValueObject<string> {
	private constructor(value: string) {
		super(value);
	}

	public static fromString(raw: string): EmailRecipient {
		const trimmed = raw.trim();
		if (!EMAIL_PATTERN.test(trimmed)) {
			throw new ValidationDomainError("Invalid recipient email", { value: raw });
		}
		return new EmailRecipient(trimmed);
	}
}
