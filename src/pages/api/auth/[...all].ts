import type { APIRoute } from "astro";
import { prisma } from "@/lib/db";
import { verifyPasskey } from "@/lib/passkey";

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
	const { auth } = await import("@/config/auth.config");
	if (
		request.method === "POST" &&
		new URL(request.url).pathname === "/api/auth/sign-in/email"
	) {
		const body = (await request.clone().json().catch(() => null)) as
			| { email?: unknown; password?: unknown }
			| null;
		if (typeof body?.email === "string" && typeof body.password === "string") {
			const email = body.email.trim().toLowerCase();
			const appUser = await prisma().user.findFirst({
				where: { email: { equals: email, mode: "insensitive" } },
				select: {
					id: true,
					email: true,
					name: true,
					emailVerified: true,
					passkey: true,
				},
			});
			if (appUser?.passkey && verifyPasskey(body.password, appUser.passkey)) {
				const existingAuthUser = await prisma().authUser.findFirst({
					where: { email: { equals: email, mode: "insensitive" } },
					select: { id: true, appUserId: true },
				});
				const authUserId = existingAuthUser?.id ?? crypto.randomUUID();
				if (!existingAuthUser) {
					await prisma().authUser.create({
						data: {
							id: authUserId,
							name: appUser.name,
							email,
							emailVerified: appUser.emailVerified,
							appUserId: appUser.id,
						},
					});
				} else if (existingAuthUser.appUserId !== appUser.id) {
					await prisma().authUser.update({
						where: { id: authUserId },
						data: { appUserId: appUser.id },
					});
				}

				const credential = await prisma().authAccount.findFirst({
					where: { userId: authUserId, providerId: "credential" },
					select: { id: true },
				});
				if (!credential) {
					await prisma().authAccount.create({
						data: {
							id: crypto.randomUUID(),
							accountId: authUserId,
							providerId: "credential",
							userId: authUserId,
							password: appUser.passkey,
						},
					});
				}
			}
		}
	}
	return auth.handler(request);
};
