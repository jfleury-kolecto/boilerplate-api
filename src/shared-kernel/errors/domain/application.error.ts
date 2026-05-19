export abstract class ApplicationError extends Error {
	public readonly payload: Record<string, unknown>;

	public constructor(message: string, payload: Record<string, unknown> = {}) {
		super(message);
		this.name = this.constructor.name;
		this.payload = payload;
	}
}

export class RessourceAlreadyExistsApplicationError extends ApplicationError {}
export class RessourceNotFoundApplicationError extends ApplicationError {}
