import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { dash } from "@better-auth/infra";
import { passkey } from "@better-auth/passkey";
import { hashPasskey, verifyPasskey } from "@/lib/passkey";
import { sendTransactionalEmail } from "@/lib/email";
import { ENV } from "@/config/config.env";
import { prisma } from "@/lib/db";
import { ensureOAuthUser } from "@/lib/oauth-users";
import { organization, twoFactor } from "better-auth/plugins";

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
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 12,
		maxPasswordLength: 128,
		requireEmailVerification: true,
		revokeSessionsOnPasswordReset: true,
		password: {
			hash: async (password) => hashPasskey(password),
			verify: async ({ password, hash }) => verifyPasskey(password, hash),
		},
		sendResetPassword: async ({ user, url }) => {
			await sendTransactionalEmail({
				to: user.email,
				subject: "Restablece tu contraseña | Empresa Plana",
				text: `Para restablecer tu contraseña, abre este enlace: ${url}`,
			});
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		sendOnSignIn: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			await sendTransactionalEmail({
				to: user.email,
				subject: "Verifica tu correo | Empresa Plana",
				text: `Confirma tu correo electrónico abriendo este enlace: ${url}`,
			});
		},
	},
	socialProviders,
	user: {
		modelName: "AuthUser",
		additionalFields: {
			username: {
				type: "string",
				required: false,
				input: true,
				returned: false,
			},
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
	plugins: [
		dash(),
		twoFactor({ schema: { twoFactor: { modelName: "AuthTwoFactor" } } }),
		passkey({
			rpID: ENV.webAuthnRpId ?? "localhost",
			rpName: "Empresa Plana",
			origin: ENV.betterAuthUrl ?? "http://localhost:4321",
			schema: { passkey: { modelName: "AuthPasskey" } },
		}),
		organization({
			schema: {
				organization: { modelName: "AuthOrganization" },
				member: { modelName: "AuthMember" },
				invitation: { modelName: "AuthInvitation" },
			},
			allowUserToCreateOrganization: async (user) => {
				if (typeof user.appUserId !== "number") return false;
				const appUser = await prisma().user.findUnique({
					where: { id: user.appUserId },
					select: { role: true },
				});
				return appUser?.role === "admin" || appUser?.role === "manager";
			},
			organizationHooks: {
				beforeCreateOrganization: async () => {
					const existing = await prisma().authOrganization.count();
					if (existing > 0) {
						throw new APIError("FORBIDDEN", {
							message: "Empresa Plana already has an organization.",
						});
					}
				},
			},
			sendInvitationEmail: async (data) => {
				const inviteUrl = `${ENV.betterAuthUrl ?? "http://localhost:4321"}/dashboard/organization/accept?invitationId=${encodeURIComponent(data.id)}`;
				await sendTransactionalEmail({
					to: data.email,
					subject: "Invitación al equipo | Empresa Plana",
					text: `Has recibido una invitación al equipo de Empresa Plana. Acéptala aquí: ${inviteUrl}`,
				});
			},
		}),
	],
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
					if (!user.email) {
						throw new APIError("BAD_REQUEST", {
							message: "An email address is required.",
						});
					}
					const appUserId = await ensureOAuthUser(
						user.email,
						user.name,
						user.emailVerified,
						typeof user.username === "string" ? user.username : null,
					);
					return {
						data: {
							...user,
							email: user.email.trim().toLowerCase(),
							appUserId,
						},
					};
				},
			},
			update: {
				after: async (user) => {
					if (!user.emailVerified || typeof user.appUserId !== "number") {
						return;
					}
					await prisma().user.update({
						where: { id: user.appUserId },
						data: { emailVerified: true },
					});
				},
			},
		},
	},
	onAPIError: {
		errorURL: "/dashboard/login?oauth=failed",
	},
});
