import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Logger } from "@nestjs/common";
import { Server } from "@nestjs/microservices";
import { firstValueFrom, isObservable } from "rxjs";
import type { Message as SqsMessage } from "@aws-sdk/client-sqs";
import type { CustomTransportStrategy } from "@nestjs/microservices";

import type { CorrelationContextService } from "@/shared-kernel/correlation/domain/services/correlation-context.service";

interface ISqsServerOptions {
	queueUrl: string;
	region: string;
	correlation: CorrelationContextService;
	endpoint?: string;
	waitTimeSeconds?: number;
	maxNumberOfMessages?: number;
}

interface IEventBridgeEnvelope {
	"detail-type": string;
	detail: { correlationId?: string | null } & Record<string, unknown>;
	source?: string;
	id?: string;
}

const DEFAULT_WAIT_TIME_SECONDS = 20;
const DEFAULT_MAX_MESSAGES = 10;

export class SqsServerStrategy extends Server implements CustomTransportStrategy {
	protected override readonly logger = new Logger(SqsServerStrategy.name);
	private readonly _client: SQSClient;
	private readonly _queueUrl: string;
	private readonly _waitTimeSeconds: number;
	private readonly _maxMessages: number;
	private readonly _correlation: CorrelationContextService;
	private _stopping = false;

	public constructor(options: ISqsServerOptions) {
		super();
		this._queueUrl = options.queueUrl;
		this._waitTimeSeconds = options.waitTimeSeconds ?? DEFAULT_WAIT_TIME_SECONDS;
		this._maxMessages = options.maxNumberOfMessages ?? DEFAULT_MAX_MESSAGES;
		this._correlation = options.correlation;
		this._client = new SQSClient({
			region: options.region,
			...(options.endpoint !== undefined && options.endpoint !== "" && { endpoint: options.endpoint }),
		});
	}

	public listen(callback: () => void): void {
		this.logger.log(`SQS listener started — polling ${this._queueUrl}`);
		void this._poll();
		callback();
	}

	public close(): void {
		this._stopping = true;
		this._client.destroy();
	}

	public on(): void {
		// CustomTransportStrategy requires this signature; SQS has no event hooks.
	}

	public unwrap<TClient>(): TClient {
		return this._client as unknown as TClient;
	}

	private async _poll(): Promise<void> {
		// biome-ignore-start lint/performance/noAwaitInLoops: long-poll cycle is intentionally sequential
		// biome-ignore-start lint/style/useNamingConvention: AWS SDK requires PascalCase keys
		while (!this._stopping) {
			try {
				const response = await this._client.send(
					new ReceiveMessageCommand({
						MaxNumberOfMessages: this._maxMessages,
						QueueUrl: this._queueUrl,
						WaitTimeSeconds: this._waitTimeSeconds,
					}),
				);

				const messages = response.Messages ?? [];
				await Promise.all(messages.map((message) => this._handleMessage(message)));
			} catch (error) {
				if (this._stopping) {
					return;
				}
				const message = error instanceof Error ? error.message : String(error);
				this.logger.error(`SQS poll failed: ${message}`);
			}
		}
		// biome-ignore-end lint/style/useNamingConvention: AWS SDK requires PascalCase keys
		// biome-ignore-end lint/performance/noAwaitInLoops: long-poll cycle is intentionally sequential
	}

	private async _handleMessage(message: SqsMessage): Promise<void> {
		if (message.Body === undefined || message.ReceiptHandle === undefined) {
			return;
		}

		let envelope: IEventBridgeEnvelope;
		try {
			envelope = JSON.parse(message.Body) as IEventBridgeEnvelope;
		} catch {
			this.logger.error(`Cannot parse SQS body — dropping: ${message.MessageId ?? "?"}`);
			await this._ack(message.ReceiptHandle);
			return;
		}

		const pattern = envelope["detail-type"];
		const handler = this.messageHandlers.get(pattern);
		if (handler === undefined) {
			this.logger.warn(`No handler for pattern '${pattern}' — dropping`);
			await this._ack(message.ReceiptHandle);
			return;
		}

		const correlationId =
			typeof envelope.detail.correlationId === "string" && envelope.detail.correlationId.length > 0
				? envelope.detail.correlationId
				: this._correlation.generate();

		try {
			await this._correlation.run(correlationId, async () => {
				const result = await handler(envelope.detail);
				if (isObservable(result)) {
					await firstValueFrom(result);
				}
			});
			await this._ack(message.ReceiptHandle);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.logger.error(`Handler '${pattern}' threw — leaving on queue for retry: ${errorMessage}`);
		}
	}

	private async _ack(receiptHandle: string): Promise<void> {
		// biome-ignore-start lint/style/useNamingConvention: <AWS SDK requires PascalCase keys>
		await this._client.send(
			new DeleteMessageCommand({
				QueueUrl: this._queueUrl,
				ReceiptHandle: receiptHandle,
			}),
		);
		// biome-ignore-end lint/style/useNamingConvention: <AWS SDK requires PascalCase keys>
	}
}
