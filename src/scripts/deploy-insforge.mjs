import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

if (process.argv.slice(2).some((arg) => arg !== "--dry-run")) {
	throw new Error("Usage: bun run deploy:insforge [--dry-run]");
}

const root = fileURLToPath(new URL("../../", import.meta.url));
process.chdir(root);
config({ path: [".env.production", ".env.local", ".env"], quiet: true });

const origin = new URL(
	process.env.INSFORGE_DEPLOY_URL ?? "https://empresaplana-cat.fly.dev",
);
if (
	origin.protocol !== "https:" ||
	origin.username ||
	origin.password ||
	origin.pathname !== "/" ||
	origin.search ||
	origin.hash
) {
	throw new Error(
		"INSFORGE_DEPLOY_URL must be an HTTPS origin without a path.",
	);
}

/**
 * App de destino. El nombre tiene que coincidir con `app` de `fly.toml`: flyctl
 * lanza el deploy a partir de ese fichero cuando se invoca `flyctl deploy` a
 * secas (es el caso del workflow de GitHub), y si el script declarase otro app
 * habría dos fuentes de verdad en pugna.
 *
 * Para volver al app anterior: INSFORGE_DEPLOY_APP=empresaplana-web
 */
const app = process.env.INSFORGE_DEPLOY_APP ?? "empresaplana-cat";

const keys = [
	"DATABASE_URL",
	"INSFORGE_URL",
	"INSFORGE_ANON_KEY",
	"OPENROUTER_API_KEY",
	"OPENROUTER_CHAT_MODEL",
	"TRACKING_HASH_SECRET",
];
const env = Object.fromEntries(
	keys.filter((key) => process.env[key]).map((key) => [key, process.env[key]]),
);
for (const key of [
	"DATABASE_URL",
	"INSFORGE_URL",
	"INSFORGE_ANON_KEY",
	"TRACKING_HASH_SECRET",
]) {
	if (!env[key]) throw new Error(`${key} is required for deployment.`);
}
Object.assign(env, {
	NODE_ENV: "production",
	HOST: "0.0.0.0",
	PORT: "8080",
	APP_URL: process.env.APP_URL || origin.origin,
});

const flyBin = join(homedir(), ".fly", "bin");
const path = existsSync(join(flyBin, "flyctl"))
	? `${flyBin}${delimiter}${process.env.PATH ?? ""}`
	: process.env.PATH;
const args = [
	"-y",
	"@insforge/cli",
	"compute",
	"deploy",
	".",
	"--name",
	app,
	"--port",
	"8080",
	"--region",
	"fra",
	"--memory",
	"512",
];

if (process.argv.includes("--dry-run")) {
	console.log(`npx ${args.join(" ")} --env-file <private-temporary-file>`);
	console.log(`Origin: ${origin.origin}`);
	console.log(`Runtime variables: ${Object.keys(env).join(", ")}`);
} else {
	const directory = mkdtempSync(join(tmpdir(), "empresaplana-deploy-"));
	const file = join(directory, "runtime.env");
	try {
		writeFileSync(
			file,
			`${Object.entries(env)
				.map(([key, value]) => `${key}=${JSON.stringify(value)}`)
				.join("\n")}\n`,
			{ mode: 0o600 },
		);
		const child = spawn("npx", [...args, "--env-file", file], {
			cwd: root,
			stdio: "inherit",
			env: { ...process.env, PATH: path },
		});
		const interrupt = () => child.kill("SIGINT");
		const terminate = () => child.kill("SIGTERM");
		process.on("SIGINT", interrupt);
		process.on("SIGTERM", terminate);
		try {
			process.exitCode = await new Promise((resolve, reject) => {
				child.once("error", reject);
				child.once("exit", (code, signal) =>
					resolve(code ?? (signal === "SIGINT" ? 130 : 1)),
				);
			});
		} finally {
			process.off("SIGINT", interrupt);
			process.off("SIGTERM", terminate);
		}
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
}
