import { ApiProperty } from "@nestjs/swagger";

export class QuoteSummaryOutputDto {
	@ApiProperty({ example: "019ad951-368a-7de5-b7ba-add19cfd187b", type: String })
	public id!: string;

	@ApiProperty({ example: "019be5e6-c357-733b-8857-25fef291279f", type: String })
	public customerId!: string;

	@ApiProperty({ example: "EUR", type: String })
	public currency!: string;

	@ApiProperty({ enum: ["draft", "sent", "accepted", "rejected"], example: "sent", type: String })
	public status!: string;

	@ApiProperty({ description: "Aggregated server-side via SQL SUM", example: 35000, type: Number })
	public totalAmountCents!: number;
}
