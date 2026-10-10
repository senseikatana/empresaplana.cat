import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const locales = ["ca", "en", "es", "fr"] as const;

function valueType(value: unknown): string {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	return typeof value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function differences(
	expected: unknown,
	actual: unknown,
	locale: string,
	path = "",
): string[] {
	const expectedType = valueType(expected);
	const actualType = valueType(actual);
	if (expectedType !== actualType) {
		return [
			`${locale}: "${path || "<root>"}" has type ${actualType}; expected ${expectedType}`,
		];
	}

	if (isRecord(expected) && isRecord(actual)) {
		const errors: string[] = [];
		for (const key of Object.keys(expected).sort()) {
			const keyPath = path ? `${path}.${key}` : key;
			if (!Object.hasOwn(actual, key)) {
				errors.push(`${locale}: missing key "${keyPath}"`);
			} else {
				errors.push(...differences(expected[key], actual[key], locale, keyPath));
			}
		}
		for (const key of Object.keys(actual).sort()) {
			if (!Object.hasOwn(expected, key)) {
				const keyPath = path ? `${path}.${key}` : key;
				errors.push(`${locale}: unexpected key "${keyPath}"`);
			}
		}
		return errors;
	}

	if (Array.isArray(expected) && Array.isArray(actual)) {
		const errors: string[] = [];
		for (let index = 0; index < Math.min(expected.length, actual.length); index++) {
			errors.push(
				...differences(expected[index], actual[index], locale, `${path}[${index}]`),
			);
		}
		return errors;
	}

	return [];
}

function loadDictionary(locale: (typeof locales)[number]): unknown {
	return JSON.parse(
		readFileSync(new URL(`../src/config/i18n/${locale}.json`, import.meta.url), "utf8"),
	);
}

describe("translation dictionary parity", () => {
	it("keeps all supported locale keys and value types aligned with Spanish", () => {
		const reference = loadDictionary("es");
		const errors = locales
			.filter((locale) => locale !== "es")
			.flatMap((locale) => differences(reference, loadDictionary(locale), locale));

		assert.deepEqual(errors, [], errors.join("\n"));
	});

	it("reports missing, unexpected, and incompatible entries with locale and key paths", () => {
		assert.deepEqual(
			differences(
				{ profile: { name: "Name" }, labels: ["One"], count: 1 },
				{ profile: "Perfil", labels: [2], extra: true },
				"ca",
			),
			[
				'ca: missing key "count"',
				'ca: "labels[0]" has type number; expected string',
				'ca: "profile" has type string; expected object',
				'ca: unexpected key "extra"',
			],
		);
	});
});
