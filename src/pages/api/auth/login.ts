import type { APIRoute } from "astro";
import { isRole, postLoginDestination } from "@/lib/acl";
import { setSessionCookie, signSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyPasskey } from "@/lib/passkey";
import { publicUser } from "@/lib/users";
import { formatValidationError, loginSchema } from "@/lib/validation/users";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "invalid_body" }, { status: 400 });
	}

	const parsed = loginSchema.safeParse(body);
	if (!parsed.success) {
		return Response.json(formatValidationError(parsed.error), { status: 400 });
	}

	const { username, passkey, redirect, locale } = parsed.data;
	const user = await prisma().user.findFirst({
		where: { username },
	});
	if (!user || !verifyPasskey(passkey, user.passkey)) {
		return Response.json({ error: "invalid_credentials" }, { status: 401 });
	}
	if (!isRole(user.role)) {
		return Response.json({ error: "account_role_invalid" }, { status: 403 });
	}

	const token = await signSessionToken({
		id: user.id,
		username: user.username,
		role: user.role,
	});
	setSessionCookie(cookies, token);
	return Response.json({
		user: publicUser(user),
		next: postLoginDestination(user.role, redirect, locale),
	});
};
