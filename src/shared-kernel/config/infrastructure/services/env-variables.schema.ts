import { IsIn, IsNumber, IsOptional, IsString } from "class-validator";

export class EnvironmentVariablesSchema {
	@IsString()
	@IsIn(["local", "development", "production", "test", "openapi"])
	public NODE_ENV!: "local" | "development" | "production" | "test" | "openapi";

	@IsNumber()
	public PORT!: number;

	@IsString()
	public EVENT_BUS_NAME!: string;

	@IsString()
	public AWS_REGION!: string;

	@IsOptional()
	@IsString()
	public AWS_ENDPOINT_URL_EVENTS?: string;

	@IsString()
	public NOTIFICATION_QUEUE_URL!: string;

	@IsOptional()
	@IsString()
	public AWS_ENDPOINT_URL_SQS?: string;

	@IsOptional()
	@IsString()
	public OUTBOX_RELAY_INTERVAL_MS?: string;

	@IsOptional()
	@IsString()
	public EMAIL_NOTIFICATION_RELAY_INTERVAL_MS?: string;
}
