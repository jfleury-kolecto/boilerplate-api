import { defineConfig } from "vitest/config";

import { resolve } from "node:path";

const rootDir: string = resolve(process.cwd(), "src");
const testsDir: string = resolve(process.cwd(), "tests");

// biome-ignore lint/style/noDefaultExport: Config export attendu par Vitest
export default defineConfig({
	resolve: {
		alias: [
			{ find: "@/tests", replacement: testsDir },
			{ find: "@", replacement: rootDir },
		],
	},
	test: {
		clearMocks: true,
		coverage: {
			enabled: true,
			exclude: ["src/**/*.spec.ts", "src/**/*.test.ts", "**/*.d.ts", "dist/**", "src/common/domain/errors/**"],
			include: ["src/**/domain/**/*.ts", "src/**/application/**/*.ts", "tests/**/*.ts"],
			provider: "v8",
			reporter: ["text"],
			reportsDirectory: "./coverage",
		},
		environment: "node",
		exclude: ["dist/**", "node_modules/**"],
		globals: true,
	},
});
