import { ValidationDomainError } from "@/shared-kernel/errors/domain/domain.error";

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_RECIPIENT_LENGTH = 254;
const MAX_SUBJECT_LENGTH = 998;
const MAX_BODY_LENGTH = 100_000;

export class EmailMessage {
	private readonly _to: string;
	private readonly _subject: string;
	private readonly _body: string;

	private constructor(to: string, subject: string, body: string) {
		this._to = to;
		this._subject = subject;
		this._body = body;
	}

	public static of(to: string, subject: string, body: string): EmailMessage {
		if (!EMAIL_PATTERN.test(to) || to.length > MAX_RECIPIENT_LENGTH) {
			throw new ValidationDomainError("Invalid recipient address", { value: to });
		}
		const trimmedSubject = subject.trim();
		if (trimmedSubject.length === 0) {
			throw new ValidationDomainError("Email subject cannot be empty", {});
		}
		if (subject.length > MAX_SUBJECT_LENGTH) {
			throw new ValidationDomainError("Email subject is too long", {
				length: subject.length,
				max: MAX_SUBJECT_LENGTH,
			});
		}
		const trimmedBody = body.trim();
		if (trimmedBody.length === 0) {
			throw new ValidationDomainError("Email body cannot be empty", {});
		}
		if (body.length > MAX_BODY_LENGTH) {
			throw new ValidationDomainError("Email body is too long", { length: body.length, max: MAX_BODY_LENGTH });
		}
		return new EmailMessage(to, subject, body);
	}

	public get to(): string {
		return this._to;
	}

	public get subject(): string {
		return this._subject;
	}

	public get body(): string {
		return this._body;
	}
}
