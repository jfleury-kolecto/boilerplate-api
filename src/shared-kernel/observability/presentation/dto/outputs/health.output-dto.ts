import { ApiProperty } from "@nestjs/swagger";

class WorkerHealthSnapshotDto {
	@ApiProperty({
		description: "Worker name (e.g. outbox-relay).",
		example: "outbox-relay",
		type: String,
	})
	public name!: string;

	@ApiProperty({
		description: "True when this worker ticked within its threshold.",
		example: true,
		type: Boolean,
	})
	public healthy!: boolean;

	@ApiProperty({
		description: "Timestamp of the last tick, or null before the first one.",
		example: "2026-04-24T10:30:00.000Z",
		nullable: true,
		required: false,
		type: String,
	})
	public lastTickAt!: string | null;

	@ApiProperty({
		description: "Max age (ms) the last tick can have before this worker is considered unhealthy.",
		example: 10000,
		type: Number,
	})
	public thresholdMs!: number;
}

export class HealthOutputDto {
	@ApiProperty({
		description: "True when every registered worker is healthy.",
		example: true,
		type: Boolean,
	})
	public healthy!: boolean;

	@ApiProperty({
		description: "Snapshot of every registered worker.",
		isArray: true,
		type: WorkerHealthSnapshotDto,
	})
	public workers!: WorkerHealthSnapshotDto[];
}
