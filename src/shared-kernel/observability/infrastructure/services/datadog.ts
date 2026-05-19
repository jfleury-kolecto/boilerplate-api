export function initDatadog(service: string): void {
	// biome-ignore lint/style/noProcessEnv: <dd-trace initializes before Nest bootstrap, ConfigService is not yet available>
	// biome-ignore lint/complexity/useLiteralKeys: <noPropertyAccessFromIndexSignature forbids dot access on process.env>
	const nodeEnv = process.env["NODE_ENV"];

	if (nodeEnv === undefined || nodeEnv === "local" || nodeEnv === "test") {
		return;
	}

	// biome-ignore lint/style/noProcessEnv: <dd-trace initializes before Nest bootstrap>
	// biome-ignore lint/complexity/useLiteralKeys: <noPropertyAccessFromIndexSignature>
	const version = process.env["APP_VERSION"];

	require("dd-trace").init({
		env: nodeEnv,
		logInjection: true,
		service,
		version,
	});
}
