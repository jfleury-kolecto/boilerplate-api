import { QuoteLine } from "@/modules/quote/domain/entities/quote-line.entity";
import { QuoteAccepted } from "@/modules/quote/domain/events/quote-accepted.event";
import { QuoteCreated } from "@/modules/quote/domain/events/quote-created.event";
import { QuoteRejected } from "@/modules/quote/domain/events/quote-rejected.event";
import { QuoteSent } from "@/modules/quote/domain/events/quote-sent.event";
import { Currency } from "@/modules/quote/domain/value-objects/currency.vo";
import { Money } from "@/modules/quote/domain/value-objects/money.vo";
import { QuoteStatus } from "@/modules/quote/domain/value-objects/quote-status.vo";
import { AggregateRoot } from "@/shared-kernel/building-blocks/domain/aggregates/aggregate-root";
import { InvalidTransitionDomainError, ValidationDomainError } from "@/shared-kernel/errors/domain/domain.error";
import { UuidV7 } from "@/shared-kernel/id/domain/value-objects/uuid-v7.vo";
import type { ICreateQuoteCommand } from "@/modules/quote/domain/commands/create-quote.command";
import type { IQuotePrimitives } from "@/modules/quote/domain/primitives/quote.primitives";
import type { EmailRecipient } from "@/modules/quote/domain/value-objects/email-recipient.vo";

export class Quote extends AggregateRoot<UuidV7> {
	private readonly _customerId: UuidV7;
	private readonly _currency: Currency;
	private _status: QuoteStatus;
	private _lines: QuoteLine[];

	private constructor(id: UuidV7, customerId: UuidV7, currency: Currency, status: QuoteStatus, lines: QuoteLine[]) {
		super(id);
		this._customerId = customerId;
		this._currency = currency;
		this._status = status;
		this._lines = lines;
	}

	// ─── Getters ──────────────────────────────────────────────────────────

	public get customerId(): UuidV7 {
		return this._customerId;
	}

	public get currency(): Currency {
		return this._currency;
	}

	public get status(): QuoteStatus {
		return this._status;
	}

	public get lines(): readonly QuoteLine[] {
		return this._lines;
	}

	// ─── Computed ─────────────────────────────────────────────────────────

	public totalAmount(): Money {
		return this._lines.reduce<Money>((acc, line) => acc.add(line.lineTotal()), Money.zero(this._currency));
	}

	// ─── Factory ──────────────────────────────────────────────────────────

	public static create(command: ICreateQuoteCommand): Quote {
		if (command.lines.length === 0) {
			throw new ValidationDomainError("Quote must have at least one line", { quoteId: command.id });
		}

		const currency = Currency.fromString(command.currency);
		const lines = command.lines.map((line) => QuoteLine.create(line, currency));

		const aggregate = new Quote(
			UuidV7.fromString(command.id),
			UuidV7.fromString(command.customerId),
			currency,
			QuoteStatus.draft(),
			lines,
		);

		aggregate._recordEvent(
			new QuoteCreated(aggregate.id.value, aggregate._customerId.value, aggregate._currency.value),
		);

		return aggregate;
	}

	// ─── Behaviors ────────────────────────────────────────────────────────

	public send(recipient: EmailRecipient): void {
		if (this._lines.length === 0) {
			throw new InvalidTransitionDomainError("Cannot send an empty Quote", { quoteId: this.id.value });
		}

		this._status = this._status.send();

		const total = this.totalAmount();
		this._recordEvent(new QuoteSent(this.id.value, total.amountInCents, total.currency.value, recipient.value));
	}

	public accept(): void {
		this._status = this._status.accept();
		this._recordEvent(new QuoteAccepted(this.id.value));
	}

	public reject(): void {
		this._status = this._status.reject();
		this._recordEvent(new QuoteRejected(this.id.value));
	}

	// ─── Persistence ──────────────────────────────────────────────────────

	public static fromPrimitives(primitives: IQuotePrimitives): Quote {
		const currency = Currency.fromString(primitives.currency);
		return new Quote(
			UuidV7.fromString(primitives.id),
			UuidV7.fromString(primitives.customerId),
			currency,
			QuoteStatus.fromString(primitives.status),
			primitives.lines.map((line) => QuoteLine.fromPrimitives(line, currency)),
		);
	}

	public toPrimitives(): IQuotePrimitives {
		return {
			currency: this._currency.value,
			customerId: this._customerId.value,
			id: this.id.value,
			lines: this._lines.map((line) => line.toPrimitives()),
			status: this._status.value,
		};
	}
}
