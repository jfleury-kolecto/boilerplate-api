import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// biome-ignore lint/style/noProcessEnv: <drizzle-kit runs outside Nest's ConfigService>
// biome-ignore lint/complexity/useLiteralKeys: <TS noPropertyAccessFromIndexSignature forbids dot access>
const databaseUrl = process.env["DATABASE_URL"] ?? "";

// biome-ignore lint/style/noDefaultExport: <Config expected by drizzle-kit>
export default defineConfig({
	dbCredentials: {
		url: databaseUrl,
	},
	dialect: "postgresql",
	out: "./drizzle",
	schema: "./src/shared-kernel/database/infrastructure/drizzle/schema.ts",
});
