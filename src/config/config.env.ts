import { existsSync } from "node:fs";
import { config } from "dotenv";

config({ path: existsSync(".env") ? ".env" : ".env.production" });

export const ENV = {
	authSecret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
	betterAuthUrl: process.env.BETTER_AUTH_URL,
	googleClientId: process.env.GOOGLE_CLIENT_ID,
	googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
	githubClientId: process.env.GITHUB_CLIENT_ID,
	githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
};

export const oauthProviders = [
	...(ENV.googleClientId && ENV.googleClientSecret
		? (["google"] as const)
		: []),
	...(ENV.githubClientId && ENV.githubClientSecret
		? (["github"] as const)
		: []),
];
