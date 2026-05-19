import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { AppModule } from "@/composition-root/app.module";

/**
 * Export the OpenAPI schema to a file named "openapi.json".
 * This file is used to generate the API documentation and the client code.
 */
async function openApiExportCommand(): Promise<void> {
	const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
		logger: false,
	});

	const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf-8"));

	const config = new DocumentBuilder()
		.setTitle(packageJson.name)
		.setDescription(packageJson.description)
		.setVersion(packageJson.version)
		.build();

	const document = SwaggerModule.createDocument(app, config);

	const outFile = resolve(process.cwd(), "openapi.json");
	mkdirSync(dirname(outFile), { recursive: true });
	writeFileSync(outFile, JSON.stringify(document, null, 2), { encoding: "utf-8" });

	await app.close();
}

openApiExportCommand().catch((err) => {
	// biome-ignore lint/suspicious/noConsole: <error handling>
	console.error(err);
	process.exit(1);
});
