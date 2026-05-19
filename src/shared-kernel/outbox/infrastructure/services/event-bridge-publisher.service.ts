import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import type { ConfigService } from "@nestjs/config";

import { EventPublisherService } from "@/shared-kernel/outbox/domain/services/event-publisher.service";
import type { IOutboxMessage } from "@/shared-kernel/outbox/domain/services/event-publisher.service";

const EVENT_SOURCE = "boilerplate.api";

export class EventBridgePublisherService extends EventPublisherService {
	private readonly _client: EventBridgeClient;
	private readonly _busName: string;

	public constructor(configService: ConfigService) {
		super();
		const region = configService.get<string>("AWS_REGION") ?? "us-east-1";
		const endpoint = configService.get<string>("AWS_ENDPOINT_URL_EVENTS");

		this._busName = configService.get<string>("EVENT_BUS_NAME") ?? "";
		if (this._busName === "") {
			throw new Error("EVENT_BUS_NAME is not set — cannot initialize EventBridgePublisherService");
		}

		this._client = new EventBridgeClient({
			region,
			...(endpoint !== undefined && endpoint !== "" && { endpoint }),
		});
	}

	public async publishBatch(messages: IOutboxMessage[]): Promise<void> {
		if (messages.length === 0) {
			return;
		}

		// biome-ignore-start lint/style/useNamingConvention: <AWS SDK requires PascalCase keys>
		const command = new PutEventsCommand({
			Entries: messages.map((message) => ({
				Detail: JSON.stringify({
					aggregateId: message.aggregateId,
					correlationId: message.correlationId,
					id: message.id,
					occurredAt: message.occurredAt.toISOString(),
					payload: message.payload,
				}),
				DetailType: message.eventName,
				EventBusName: this._busName,
				Source: EVENT_SOURCE,
			})),
		});
		// biome-ignore-end lint/style/useNamingConvention: <AWS SDK requires PascalCase keys>

		const result = await this._client.send(command);

		if (result.FailedEntryCount !== undefined && result.FailedEntryCount > 0) {
			throw new Error(`EventBridge PutEvents partially failed: ${JSON.stringify(result.Entries)}`);
		}
	}
}
