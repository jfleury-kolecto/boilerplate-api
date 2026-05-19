import { Logger } from "@nestjs/common";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as Schema from "@/shared-kernel/database/infrastructure/drizzle/schema";

export type TDatabase = NodePgDatabase<typeof Schema>;
export type TDatabaseClient = Parameters<Parameters<TDatabase["transaction"]>[0]>[0];

export class DrizzleService implements OnModuleInit, OnModuleDestroy {
	private readonly _logger = new Logger(DrizzleService.name);
	private readonly _pool: Pool;
	public readonly db: TDatabase;

	public constructor(configService: ConfigService) {
		this._pool = new Pool({
			connectionString: configService.get<string>("DATABASE_URL"),
		});

		this._pool.on("error", (error) => {
			this._logger.error(`Postgres pool error: ${error.message}`);
		});

		this.db = drizzle(this._pool, { schema: Schema });
	}

	public async onModuleInit(): Promise<void> {
		await this._pool.query("SELECT 1");
	}

	public async onModuleDestroy(): Promise<void> {
		await this._pool.end();
	}
}
