/// <reference types="bun" />
import { afterEach, expect, spyOn, test } from "bun:test";
import { rejects } from "node:assert/strict";
import { ENV } from "../src/config/config.env";
import { aiPromptSchema, generateAIText } from "../src/lib/ai";

const originalKey = ENV.openRouterApiKey;
afterEach(() => {
	ENV.openRouterApiKey = originalKey;
});

test("validates trimmed prompts and the exact character limit", () => {
	expect(aiPromptSchema.safeParse("   ").success).toBe(false);
	expect(aiPromptSchema.safeParse("a".repeat(4000)).success).toBe(true);
	expect(aiPromptSchema.safeParse("a".repeat(4001)).success).toBe(false);
	expect(aiPromptSchema.parse(" hello ")).toBe("hello");
});

test("reports missing server credentials", async () => {
	ENV.openRouterApiKey = undefined;
	await rejects(generateAIText("Hello", 9001), {
		code: "not_configured",
	});
});

function mockCompletion(content: string | null) {
	const handler = Object.assign(
		async (
			_url: Parameters<typeof fetch>[0],
			options?: Parameters<typeof fetch>[1],
		) => {
			const body = JSON.parse(String(options?.body));
			expect(body.model).toBe(ENV.openRouterChatModel);
			expect(body.max_completion_tokens).toBe(800);
			expect(body.messages).toEqual([{ role: "user", content: "Hello" }]);
			return Response.json({
				id: "test",
				object: "chat.completion",
				created: 0,
				model: "openai/gpt-5.5",
				choices: [
					{
						index: 0,
						finish_reason: "stop",
						message: { role: "assistant", content },
					},
				],
			});
		},
		{ preconnect: globalThis.fetch.preconnect },
	);
	return spyOn(globalThis, "fetch").mockImplementation(handler);
}

test("limits output, returns text and blocks repeated requests", async () => {
	ENV.openRouterApiKey = "test-only-not-a-real-key";
	const fetchSpy = mockCompletion(" Test answer ");
	try {
		expect(await generateAIText(" Hello ", 9002)).toEqual({
			text: "Test answer",
			model: "openai/gpt-5.5",
		});
		await rejects(generateAIText("Hello", 9002), {
			code: "rate_limit",
		});
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	} finally {
		fetchSpy.mockRestore();
	}
});

test("does not treat an empty completion as success", async () => {
	ENV.openRouterApiKey = "test-only-not-a-real-key";
	const fetchSpy = mockCompletion(null);
	const logSpy = spyOn(console, "error").mockImplementation(() => {});
	try {
		await rejects(generateAIText("Hello", 9003), {
			code: "upstream",
		});
		expect(logSpy).toHaveBeenCalled();
	} finally {
		fetchSpy.mockRestore();
		logSpy.mockRestore();
	}
});
