export abstract class DomainError extends Error {
	public readonly payload: Record<string, unknown>;

	public constructor(message: string, payload: Record<string, unknown> = {}) {
		super(message);
		this.name = this.constructor.name;
		this.payload = payload;
	}
}

export class InvalidTransitionDomainError extends DomainError {}
export class ValidationDomainError extends DomainError {}
