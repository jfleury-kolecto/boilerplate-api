import type { ApiParamOptions } from "@nestjs/swagger";

export const QUOTE_COMMAND_API_TAG = {
	description: [
		"**Quote — write side.** State-changing operations on a quote.",
		"",
		"**Lifecycle**: `draft` → `sent` → `accepted` | `rejected`",
		"",
		"- `draft` — created with its lines; not yet shared with the customer.",
		"- `sent` — emailed to the recipient and frozen. Lines and totals can no longer change.",
		"- `accepted` / `rejected` — terminal state set by the customer.",
		"",
		"Lines are set at creation and immutable thereafter.",
	].join("\n"),
	name: "Quote · Commands",
} as const;

export const QUOTE_QUERY_API_TAG = {
	description: [
		"**Quote — read side.** Projections of a quote for clients.",
		"",
		"- `GET /quote/:id` returns the full quote, lines included.",
		"- `GET /quote/:id/summary` returns a compact view (no lines) for list pages.",
		"",
		"Line totals and quote totals are computed in SQL on read, so the view always reflects the stored line data.",
	].join("\n"),
	name: "Quote · Queries",
} as const;

export const QUOTE_ID_PARAM: ApiParamOptions = {
	description: "Quote UUID v7.",
	example: "019ad951-368a-7de5-b7ba-add19cfd187b",
	name: "id",
	required: true,
	type: String,
};
