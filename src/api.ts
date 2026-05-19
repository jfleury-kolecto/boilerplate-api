import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import type { INestApplication } from "@nestjs/common";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { OpenAPIObject } from "@nestjs/swagger";

import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { AppModule } from "@/composition-root/app.module";
import { CorrelationContextService } from "@/shared-kernel/correlation/domain/services/correlation-context.service";
import { HttpExceptionFilter } from "@/shared-kernel/errors/infrastructure/filters/http-exception.filter";
import { createValidationPipe } from "@/shared-kernel/http/infrastructure/pipes/validation.pipe";
import { SqsServerStrategy } from "@/shared-kernel/messaging/infrastructure/transports/sqs-server.transport";
import { initDatadog } from "@/shared-kernel/observability/infrastructure/services/datadog";
import { PINO_LOGGER_SERVICE_TOKEN } from "@/shared-kernel/observability/presentation/dependency-injection/observability.token";
import type { PinoLoggerService } from "@/shared-kernel/observability/infrastructure/services/pino-logger.service";

initDatadog("boilerplate-api-api");

function swaggerSetup(app: INestApplication): OpenAPIObject {
	const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf-8"));
	const config = new DocumentBuilder()
		.setTitle(packageJson.name)
		.setDescription(packageJson.description)
		.setVersion(packageJson.version)
		.build();
	const document: OpenAPIObject = SwaggerModule.createDocument(app, config);

	SwaggerModule.setup("api", app, document, {
		customSiteTitle: packageJson.name,
		raw: ["json"],
		ui: false,
	});

	const outputPath = join(process.cwd(), "openapi.json");
	writeFileSync(outputPath, JSON.stringify(document, null, 2), {
		encoding: "utf-8",
	});

	return document;
}

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

	app.getHttpAdapter()
		.getInstance()
		.addContentTypeParser(
			/^multipart\/form-data/i,
			{ parseAs: "buffer" },
			(_request: unknown, body: Buffer, done: (error: Error | null, parsedBody?: Buffer) => void) => {
				done(null, body);
			},
		);

	const configService = app.get(ConfigService);

	const PORT = configService.get<number>("PORT");
	const DEFAULT_PORT = 3000;

	const logger = app.get<PinoLoggerService>(PINO_LOGGER_SERVICE_TOKEN);
	app.useLogger(logger);

	app.useGlobalPipes(createValidationPipe());
	app.useGlobalFilters(new HttpExceptionFilter());

	app.enableCors({
		credentials: true,
		origin: true,
	});

	const document = swaggerSetup(app);

	app.use(
		"/docs",
		apiReference({
			content: document,
			withFastify: true,
		}),
	);

	const NOTIFICATION_QUEUE_URL = configService.get<string>("NOTIFICATION_QUEUE_URL");
	const AWS_REGION = configService.get<string>("AWS_REGION");
	const AWS_ENDPOINT_URL_SQS = configService.get<string>("AWS_ENDPOINT_URL_SQS");
	if (NOTIFICATION_QUEUE_URL === undefined || AWS_REGION === undefined) {
		throw new Error("NOTIFICATION_QUEUE_URL and AWS_REGION are required");
	}
	const correlation = app.get(CorrelationContextService);
	app.connectMicroservice({
		strategy: new SqsServerStrategy({
			correlation,
			queueUrl: NOTIFICATION_QUEUE_URL,
			region: AWS_REGION,
			...(AWS_ENDPOINT_URL_SQS !== undefined && { endpoint: AWS_ENDPOINT_URL_SQS }),
		}),
	});

	await app.init();
	await app.startAllMicroservices();

	await app.listen(PORT ?? DEFAULT_PORT, "0.0.0.0");
}

void bootstrap();
