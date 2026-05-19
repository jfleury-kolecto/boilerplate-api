import type { DrizzleService, TDatabaseClient } from "./drizzle.service";

export class TransactionRunner {
	public constructor(private readonly _drizzleService: DrizzleService) {}

	public run<TResult>(callback: (client: TDatabaseClient) => Promise<TResult>): Promise<TResult> {
		return this._drizzleService.db.transaction((tx) => {
			return callback(tx);
		});
	}
}
