export abstract class InfrastructureError extends Error {
	public readonly payload: Record<string, unknown>;

	public constructor(message: string, payload: Record<string, unknown> = {}) {
		super(message);
		this.name = this.constructor.name;
		this.payload = payload;
	}
}

export class ValidationInfrastructureError extends InfrastructureError {}
