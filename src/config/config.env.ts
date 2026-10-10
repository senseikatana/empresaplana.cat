import { existsSync } from "node:fs";
import { config } from "dotenv";

config({
	path: [".env.local", existsSync(".env") ? ".env" : ".env.production"],
	quiet: true,
});

export const ENV = {
	insforgeUrl: process.env.INSFORGE_URL,
	insforgeAnonKey: process.env.INSFORGE_ANON_KEY,
	appUrl: process.env.APP_URL,
	resendApiKey: process.env.RESEND_API_KEY,
	emailFrom: process.env.AUTH_EMAIL_FROM,
	openRouterApiKey: process.env.OPENROUTER_API_KEY,
	openRouterChatModel: process.env.OPENROUTER_CHAT_MODEL ?? "openai/gpt-5.5",
};
