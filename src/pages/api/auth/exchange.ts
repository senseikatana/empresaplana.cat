import type { APIRoute } from "astro";
import { isRole, postLoginDestination } from "@/lib/acl";
import { setSessionCookie, signSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureOAuthUser } from "@/lib/oauth-users";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, redirect, url }) => {
	const { auth } = await import("@/lib/better-auth");
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user.email || session.user.emailVerified !== true) {
		return redirect("/dashboard/login?oauth=failed", 302);
	}

	const authUser = await prisma().authUser.findUnique({
		where: { id: session.user.id },
		select: { appUserId: true },
	});
	if (!authUser) return redirect("/dashboard/login?oauth=failed", 302);

	const appUserId =
		authUser.appUserId ??
		(await ensureOAuthUser(session.user.email, session.user.name));
	if (authUser.appUserId === null) {
		await prisma().authUser.update({
			where: { id: session.user.id },
			data: { appUserId },
		});
	}

	const user = await prisma().user.findUnique({
		where: { id: appUserId },
		select: { id: true, username: true, role: true },
	});
	if (!user || !isRole(user.role)) {
		return redirect("/dashboard/login?oauth=failed", 302);
	}

	const token = await signSessionToken({
		id: user.id,
		username: user.username,
		role: user.role,
	});
	setSessionCookie(cookies, token);
	return redirect(
		postLoginDestination(user.role, url.searchParams.get("redirect")),
		302,
	);
};
