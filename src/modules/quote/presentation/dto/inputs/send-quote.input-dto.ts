import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class SendQuoteInputDto {
	@ApiProperty({
		description: "Email address that will receive the quote notification.",
		example: "customer@example.com",
		required: true,
		type: String,
	})
	@IsEmail()
	public recipient!: string;
}
