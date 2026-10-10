import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { ENV } from "@/config/config.env";
import { prisma } from "@/lib/db";
import { ensureOAuthUser } from "@/lib/oauth-users";

if (!ENV.authSecret) {
	throw new Error("AUTH_SECRET must be configured for Better Auth.");
}

if (process.env.NODE_ENV === "production" && !ENV.betterAuthUrl) {
	throw new Error("BETTER_AUTH_URL must be set to the production origin.");
}

const socialProviders = {
	...(ENV.googleClientId && ENV.googleClientSecret
		? {
				google: {
					clientId: ENV.googleClientId,
					clientSecret: ENV.googleClientSecret,
				},
			}
		: {}),
	...(ENV.githubClientId && ENV.githubClientSecret
		? {
				github: {
					clientId: ENV.githubClientId,
					clientSecret: ENV.githubClientSecret,
				},
			}
		: {}),
};

export const auth = betterAuth({
	appName: "Empresa Plana",
	baseURL: ENV.betterAuthUrl ?? "http://localhost:4321",
	secret: ENV.authSecret,
	database: prismaAdapter(prisma(), { provider: "postgresql" }),
	socialProviders,
	user: {
		modelName: "AuthUser",
		additionalFields: {
			appUserId: {
				type: "number",
				required: false,
				input: false,
				returned: false,
			},
		},
		validateUserInfo({ user }) {
			if (!user.email || user.emailVerified !== true) {
				return {
					error: "verified_email_required",
					errorDescription:
						"Sign in with a provider account that has a verified email address.",
				};
			}
		},
	},
	session: { modelName: "AuthSession" },
	account: {
		modelName: "AuthAccount",
		accountLinking: {
			enabled: true,
			disableImplicitLinking: false,
			requireLocalEmailVerified: true,
		},
	},
	verification: { modelName: "AuthVerification" },
	databaseHooks: {
		account: {
			create: {
				before: async (account) => ({
					data: {
						...account,
						accessToken: null,
						refreshToken: null,
						idToken: null,
						accessTokenExpiresAt: null,
						refreshTokenExpiresAt: null,
						scope: null,
					},
				}),
			},
			update: {
				before: async (account) => ({
					data: {
						...account,
						accessToken: null,
						refreshToken: null,
						idToken: null,
						accessTokenExpiresAt: null,
						refreshTokenExpiresAt: null,
						scope: null,
					},
				}),
			},
		},
		user: {
			create: {
				before: async (user) => {
					if (!user.email || user.emailVerified !== true) {
						throw new APIError("BAD_REQUEST", {
							message: "A verified email address is required.",
						});
					}
					const appUserId = await ensureOAuthUser(user.email, user.name);
					return {
						data: {
							...user,
							email: user.email.trim().toLowerCase(),
							appUserId,
						},
					};
				},
			},
		},
	},
	onAPIError: {
		errorURL: "/dashboard/login?oauth=failed",
	},
});
