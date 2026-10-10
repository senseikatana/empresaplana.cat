import type { APIRoute } from "astro";
import { isRole, postLoginDestination } from "@/lib/acl";
import { setSessionCookie, signSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureOAuthUser } from "@/lib/oauth-users";
import { getLocale, localizedPath } from "@/config/i18n/routing";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, redirect, url }) => {
	const locale = getLocale(url.searchParams.get("locale"));
	const failurePath = localizedPath("/dashboard/login?oauth=failed", locale);
	const { auth } = await import("@/config/auth.config");
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user.email || session.user.emailVerified !== true) {
		return redirect(failurePath, 302);
	}

	const authUser = await prisma().authUser.findUnique({
		where: { id: session.user.id },
		select: { appUserId: true },
	});
	if (!authUser) return redirect(failurePath, 302);

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
		return redirect(failurePath, 302);
	}

	const token = await signSessionToken({
		id: user.id,
		username: user.username,
		role: user.role,
	});
	setSessionCookie(cookies, token);
	return redirect(
		postLoginDestination(user.role, url.searchParams.get("redirect"), locale),
		302,
	);
};
