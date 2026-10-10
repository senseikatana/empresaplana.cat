import { useLogger } from "katanakit-js";

export type LogLevel = "log" | "info" | "warn" | "error" | "debug";

export function createLogger(namespace: string) {
	return {
		log: (message: unknown, data?: unknown) => useLogger("log", `[${namespace}] ${message}`, data),
		info: (message: unknown, data?: unknown) =>
			useLogger("info", `[${namespace}] ${message}`, data),
		warn: (message: unknown, data?: unknown) =>
			useLogger("warn", `[${namespace}] ${message}`, data),
		error: (message: unknown, data?: unknown) =>
			useLogger("error", `[${namespace}] ${message}`, data),
		debug: (message: unknown, data?: unknown) =>
			useLogger("debug", `[${namespace}] ${message}`, data),
	};
}
