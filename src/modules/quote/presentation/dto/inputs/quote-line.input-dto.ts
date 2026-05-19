import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString } from "class-validator";

export class QuoteLineInputDto {
	@ApiProperty({
		description: "Line description",
		example: "Consulting — 8 hours",
		required: true,
		type: String,
	})
	@IsString()
	public description!: string;

	@ApiProperty({
		description: "Quantity (integer ≥ 1)",
		example: 2,
		required: true,
		type: Number,
	})
	@IsInt()
	public quantity!: number;

	@ApiProperty({
		description: "Unit price in the Quote currency, expressed in cents",
		example: 15000,
		required: true,
		type: Number,
	})
	@IsInt()
	public unitPriceCents!: number;
}
