export abstract class PresentationError extends Error {
	public readonly payload: Record<string, unknown>;

	public constructor(message: string, payload: Record<string, unknown> = {}) {
		super(message);
		this.name = this.constructor.name;
		this.payload = payload;
	}
}

export class DtoValidationPresentationError extends PresentationError {}
export class UnauthorizedPresentationError extends PresentationError {}
export class ForbiddenPresentationError extends PresentationError {}
