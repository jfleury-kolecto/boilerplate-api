import { Type } from "class-transformer";
import { IsDateString, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";

const SUPPORTED_PAYLOAD_VERSIONS = [1] as const;

class QuoteSentEventPayloadDataDto {
	@IsInt()
	public totalAmountCents!: number;

	@IsString()
	public currency!: string;

	@IsEmail()
	public recipient!: string;
}

class QuoteSentEventPayloadDto {
	@IsIn(SUPPORTED_PAYLOAD_VERSIONS)
	public version!: (typeof SUPPORTED_PAYLOAD_VERSIONS)[number];

	@ValidateNested()
	@Type(() => QuoteSentEventPayloadDataDto)
	public data!: QuoteSentEventPayloadDataDto;
}

export class QuoteSentEventDto {
	@IsUUID("7")
	public id!: string;

	@IsUUID("7")
	public aggregateId!: string;

	@IsDateString()
	public occurredAt!: string;

	@IsOptional()
	@IsUUID("7")
	public correlationId?: string;

	@ValidateNested()
	@Type(() => QuoteSentEventPayloadDto)
	public payload!: QuoteSentEventPayloadDto;
}
