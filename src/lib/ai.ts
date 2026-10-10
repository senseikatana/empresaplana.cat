import OpenAI from "openai";
import { z } from "zod";
import { ENV } from "@/config/config.env";

export const aiPromptSchema = z.string().trim().min(1).max(4000);

export type AIErrorCode = "not_configured" | "rate_limit" | "upstream";

export class AIError extends Error {
	constructor(public readonly code: AIErrorCode) {
		super(code);
		this.name = "AIError";
	}
}

const nextRequestAt = new Map<number, number>();

export async function generateAIText(prompt: string, userId: number) {
	const content = aiPromptSchema.parse(prompt);
	if (!ENV.openRouterApiKey) throw new AIError("not_configured");
	const now = Date.now();
	for (const [id, expires] of nextRequestAt) {
		if (expires <= now) nextRequestAt.delete(id);
	}
	if (nextRequestAt.has(userId)) throw new AIError("rate_limit");
	nextRequestAt.set(userId, now + 30_000);

	const openai = new OpenAI({
		baseURL: "https://openrouter.ai/api/v1",
		apiKey: ENV.openRouterApiKey,
		timeout: 45_000,
		maxRetries: 0,
	});
	try {
		const completion = await openai.chat.completions.create({
			model: ENV.openRouterChatModel,
			messages: [{ role: "user", content }],
			max_completion_tokens: 800,
		});
		const text = completion.choices[0]?.message.content?.trim();
		if (!text) throw new AIError("upstream");
		return { text, model: completion.model };
	} catch (cause) {
		console.error("[ai] Text generation failed", {
			name: cause instanceof Error ? cause.name : "UnknownError",
			status: cause instanceof OpenAI.APIError ? cause.status : undefined,
		});
		throw new AIError("upstream");
	}
}
