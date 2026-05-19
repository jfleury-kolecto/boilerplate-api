import type { ValueObject } from "@/shared-kernel/building-blocks/domain/value-objects/value-object";

export abstract class Entity<TId extends ValueObject<string>> {
	protected readonly _id: TId;

	protected constructor(id: TId) {
		this._id = id;
	}

	public get id(): TId {
		return this._id;
	}

	public equals(other: Entity<TId>): boolean {
		return this._id.equals(other._id);
	}
}
