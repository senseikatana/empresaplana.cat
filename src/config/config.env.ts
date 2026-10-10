import { existsSync } from "node:fs";
import { config } from "dotenv";

config({
	path: [".env.local", existsSync(".env") ? ".env" : ".env.production"],
	quiet: true,
});

export const ENV = {
	authSecret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
	betterAuthUrl: process.env.BETTER_AUTH_URL,
	googleClientId: process.env.GOOGLE_CLIENT_ID,
	googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
	githubClientId: process.env.GITHUB_CLIENT_ID,
	githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
	resendApiKey: process.env.RESEND_API_KEY,
	emailFrom: process.env.AUTH_EMAIL_FROM,
	companyOrganizationId: process.env.COMPANY_ORGANIZATION_ID,
	webAuthnRpId: process.env.WEBAUTHN_RP_ID,
	openRouterApiKey: process.env.OPENROUTER_API_KEY,
	openRouterChatModel: process.env.OPENROUTER_CHAT_MODEL ?? "openai/gpt-5.5",
};

export const oauthProviders = [
	...(ENV.googleClientId && ENV.googleClientSecret
		? (["google"] as const)
		: []),
	...(ENV.githubClientId && ENV.githubClientSecret
		? (["github"] as const)
		: []),
];
