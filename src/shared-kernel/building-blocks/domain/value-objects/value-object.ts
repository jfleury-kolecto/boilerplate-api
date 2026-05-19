export abstract class ValueObject<TValue> {
	protected constructor(protected readonly _value: TValue) {}

	public get value(): TValue {
		return this._value;
	}

	public equals(other: ValueObject<TValue>): boolean {
		return this._value === other._value;
	}
}
