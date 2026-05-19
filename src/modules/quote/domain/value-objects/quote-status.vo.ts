import { ValueObject } from "@/shared-kernel/building-blocks/domain/value-objects/value-object";
import { InvalidTransitionDomainError, ValidationDomainError } from "@/shared-kernel/errors/domain/domain.error";

type TQuoteStatusValue = "accepted" | "draft" | "rejected" | "sent";

export class QuoteStatus extends ValueObject<TQuoteStatusValue> {
	private constructor(value: TQuoteStatusValue) {
		super(value);
	}

	public static draft(): QuoteStatus {
		return new QuoteStatus("draft");
	}

	public static sent(): QuoteStatus {
		return new QuoteStatus("sent");
	}

	public static accepted(): QuoteStatus {
		return new QuoteStatus("accepted");
	}

	public static rejected(): QuoteStatus {
		return new QuoteStatus("rejected");
	}

	public static fromString(raw: string): QuoteStatus {
		if (raw !== "draft" && raw !== "sent" && raw !== "accepted" && raw !== "rejected") {
			throw new ValidationDomainError("Invalid QuoteStatus", { value: raw });
		}
		return new QuoteStatus(raw);
	}

	public isDraft(): boolean {
		return this._value === "draft";
	}

	public isSent(): boolean {
		return this._value === "sent";
	}

	public send(): QuoteStatus {
		if (this._value !== "draft") {
			throw new InvalidTransitionDomainError(`Cannot send a Quote in status "${this._value}"`, {
				current: this._value,
			});
		}
		return QuoteStatus.sent();
	}

	public accept(): QuoteStatus {
		if (this._value !== "sent") {
			throw new InvalidTransitionDomainError(`Cannot accept a Quote in status "${this._value}"`, {
				current: this._value,
			});
		}
		return QuoteStatus.accepted();
	}

	public reject(): QuoteStatus {
		if (this._value !== "sent") {
			throw new InvalidTransitionDomainError(`Cannot reject a Quote in status "${this._value}"`, {
				current: this._value,
			});
		}
		return QuoteStatus.rejected();
	}
}
