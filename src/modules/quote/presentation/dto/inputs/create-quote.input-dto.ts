import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsString, ValidateNested } from "class-validator";

import { QuoteLineInputDto } from "@/modules/quote/presentation/dto/inputs/quote-line.input-dto";

export class CreateQuoteInputDto {
	@ApiProperty({
		description: "Customer identifier (UUID)",
		example: "019be5e6-c357-733b-8857-25fef291279f",
		required: true,
		type: String,
	})
	@IsString()
	public customerId!: string;

	@ApiProperty({
		description: "ISO 4217 currency code (3 letters, uppercase)",
		example: "EUR",
		required: true,
		type: String,
	})
	@IsString()
	public currency!: string;

	@ApiProperty({
		description: "At least one line. Lines are immutable once the quote is created.",
		isArray: true,
		required: true,
		type: QuoteLineInputDto,
	})
	@IsArray()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => QuoteLineInputDto)
	public lines!: QuoteLineInputDto[];
}
