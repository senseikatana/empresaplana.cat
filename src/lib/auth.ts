import type { AstroCookies } from "astro";
import { Prisma } from "../../generated/prisma/client";
import type { SessionUser, UsuarioRole } from "@/interfaces/auth";
import { isRole } from "@/lib/acl";
import { prisma } from "@/lib/db";
import { clearNativeSession, nativeAuthClient } from "@/lib/insforge-auth";
import { z } from "zod";

const identitySchema = z.object({
	id: z.uuid(),
	email: z.email(),
	emailVerified: z.literal(true),
	profile: z.record(z.string(), z.unknown()).nullable().optional(),
});
export async function resolveNativeUser(input: unknown): Promise<SessionUser> {
	const identity = identitySchema.parse(input);
	const db = prisma();
	let user = await db.user.findUnique({ where: { insforgeId: identity.id } });
	if (!user) {
		const name =
			typeof identity.profile?.name === "string"
				? identity.profile.name.slice(0, 60)
				: identity.email.split("@")[0].slice(0, 60);
		try {
			user = await db.user.create({
				data: {
					insforgeId: identity.id,
					username: `u_${identity.id.replaceAll("-", "").slice(0, 13)}`,
					email: identity.email,
					emailVerified: true,
					name,
					fullName: name,
					phone: "",
					role: "client",
				},
			});
		} catch (error) {
			if (
				!(error instanceof Prisma.PrismaClientKnownRequestError) ||
				error.code !== "P2002"
			)
				throw error;
			user = await db.user.findUnique({ where: { insforgeId: identity.id } });
			if (!user) throw error;
		}
	}
	if (user.email !== identity.email || !user.emailVerified) {
		user = await db.user.update({
			where: { id: user.id },
			data: { email: identity.email, emailVerified: true },
		});
	}
	if (!isRole(user.role))
		throw new Error("Invalid application role for InsForge identity.");
	return { id: user.id, username: user.username, role: user.role };
}
const sessions = new WeakMap<AstroCookies, Promise<SessionUser | null>>();
export function getSession(cookies: AstroCookies): Promise<SessionUser | null> {
	const cached = sessions.get(cookies);
	if (cached) return cached;
	const pending = loadSession(cookies);
	sessions.set(cookies, pending);
	return pending;
}
async function loadSession(cookies: AstroCookies): Promise<SessionUser | null> {
	if (!cookies.get("insforge_access_token")?.value) return null;
	const { data, error } = await nativeAuthClient(cookies).auth.getCurrentUser();
	if (error) {
		if (error.statusCode === 401 || error.statusCode === 403) {
			clearNativeSession(cookies);
			return null;
		}
		throw new Error(
			`InsForge session validation failed (${error.statusCode}).`,
		);
	}
	if (!data?.user || !data.user.emailVerified) return null;
	return resolveNativeUser(data.user);
}
export const clearSessionCookie = clearNativeSession;
export async function authorize(cookies: AstroCookies, role?: UsuarioRole) {
	const session = await getSession(cookies);
	if (!session)
		return {
			user: null,
			response: Response.json({ error: "unauthorized" }, { status: 401 }),
		};
	if (role && session.role !== role && session.role !== "admin") {
		return {
			user: null,
			response: Response.json({ error: "forbidden" }, { status: 403 }),
		};
	}
	return { user: session, response: null };
}
