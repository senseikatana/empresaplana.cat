import { useLogger } from "katanakit-js";

export type LogLevel = "log" | "info" | "warn" | "error" | "debug";

export function createLogger(namespace: string) {
	return {
		log: (message: unknown, data?: unknown) =>
			useLogger(`[${namespace}] ${message}`, data, "log"),
		info: (message: unknown, data?: unknown) => {
			const formattedMessage = `[${namespace}] ${message}`;
			if (data === undefined) console.info(formattedMessage);
			else console.info(formattedMessage, data);
		},
		warn: (message: unknown, data?: unknown) =>
			useLogger(`[${namespace}] ${message}`, data, "warn"),
		error: (message: unknown, data?: unknown) =>
			useLogger(`[${namespace}] ${message}`, data, "error"),
		debug: (message: unknown, data?: unknown) => {
			const formattedMessage = `[${namespace}] ${message}`;
			if (data === undefined) console.debug(formattedMessage);
			else console.debug(formattedMessage, data);
		},
	};
}
