import { ApiProperty } from "@nestjs/swagger";

class QuoteLineOutputDto {
	@ApiProperty({ example: "019be5e6-c357-733b-8857-25fef291279f", type: String })
	public id!: string;

	@ApiProperty({ example: "Consulting — 8 hours", type: String })
	public description!: string;

	@ApiProperty({ example: 2, type: Number })
	public quantity!: number;

	@ApiProperty({ description: "Unit price in cents", example: 15000, type: Number })
	public unitPriceCents!: number;

	@ApiProperty({ description: "Computed: unitPriceCents × quantity", example: 30000, type: Number })
	public lineTotalCents!: number;
}

export class QuoteOutputDto {
	@ApiProperty({ example: "019ad951-368a-7de5-b7ba-add19cfd187b", type: String })
	public id!: string;

	@ApiProperty({ example: "019be5e6-c357-733b-8857-25fef291279f", type: String })
	public customerId!: string;

	@ApiProperty({ example: "EUR", type: String })
	public currency!: string;

	@ApiProperty({ enum: ["draft", "sent", "accepted", "rejected"], example: "draft", type: String })
	public status!: string;

	@ApiProperty({ type: [QuoteLineOutputDto] })
	public lines!: QuoteLineOutputDto[];

	@ApiProperty({ description: "Sum of all line totals (cents)", example: 30000, type: Number })
	public totalAmountCents!: number;
}
