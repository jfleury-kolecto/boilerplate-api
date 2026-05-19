import { AsyncLocalStorageCorrelationContextService } from "@/shared-kernel/correlation/infrastructure/services/async-local-storage-correlation-context.service";
import { IdService } from "@/shared-kernel/id/domain/services/id.service";

class IdServiceStub extends IdService {
	public constructor(private readonly _value: string) {
		super();
	}

	public override generateUuidV7(): string {
		return this._value;
	}
}

describe("AsyncLocalStorageCorrelationContextService", () => {
	it("returns undefined outside a run() scope", () => {
		// Arrange
		const service = new AsyncLocalStorageCorrelationContextService(
			new IdServiceStub("019ad951-0000-7000-8000-000000000001"),
		);

		// Act
		const got = service.get();

		// Assert
		expect(got).toBeUndefined();
	});

	it("exposes the correlation id inside a run() scope", () => {
		// Arrange
		const service = new AsyncLocalStorageCorrelationContextService(
			new IdServiceStub("019ad951-0000-7000-8000-000000000001"),
		);
		const id = "019ad951-0000-7000-8000-deadbeefcafe";

		// Act
		const got = service.run(id, () => service.get());

		// Assert
		expect(got).toBe(id);
	});

	it("isolates concurrent run() scopes", async () => {
		// Arrange
		const service = new AsyncLocalStorageCorrelationContextService(
			new IdServiceStub("019ad951-0000-7000-8000-000000000001"),
		);

		// Act
		const [a, b] = await Promise.all([
			service.run("aaa", async () => {
				await Promise.resolve();
				return service.get();
			}),
			service.run("bbb", async () => {
				await Promise.resolve();
				return service.get();
			}),
		]);

		// Assert
		expect(a).toBe("aaa");
		expect(b).toBe("bbb");
	});

	it("delegates generate() to IdService", () => {
		// Arrange
		const expected = "019ad951-0000-7000-8000-000000000999";
		const service = new AsyncLocalStorageCorrelationContextService(new IdServiceStub(expected));

		// Act
		const generated = service.generate();

		// Assert
		expect(generated).toBe(expected);
	});
});
