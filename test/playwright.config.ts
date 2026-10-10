import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const cwd = fileURLToPath(new URL("../", import.meta.url));

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: true,
	// Sin reintentos, un unico flake de infraestructura bloquea un push entero.
	// El fallo observado es una carrera en la limpieza de traces entre workers
	// ("browserContext.close: ENOENT"), no una asercion: los tests pasaban. En
	// local se mantiene 0 para no enmascarar regresiones; en CI el runner esta
	// mas cargado y se tolerate.
	retries: process.env.CI ? 2 : 0,
	workers: 2,
	reporter: [
		["list"],
		["html", { open: "never", outputFolder: "playwright-report" }],
	],
	outputDir: "test-results",
	use: {
		baseURL: "http://127.0.0.1:4400",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [
		{ name: "desktop", use: { ...devices["Desktop Chrome"] } },
		{ name: "mobile", use: { ...devices["Pixel 7"] } },
	],
	webServer: [
		{
			command: "node test/fixtures/auth-server.mjs",
			cwd,
			url: "http://127.0.0.1:4401/api/auth/public-config",
			reuseExistingServer: false,
		},
		{
			command: "bun run dev --host 127.0.0.1 --port 4400 --ignore-lock",
			cwd,
			url: "http://127.0.0.1:4400",
			reuseExistingServer: false,
			timeout: 120_000,
			env: {
				INSFORGE_URL: "http://127.0.0.1:4401",
				INSFORGE_ANON_KEY: "e2e-local-fixture",
				APP_URL: "http://127.0.0.1:4400",
			},
		},
	],
});
