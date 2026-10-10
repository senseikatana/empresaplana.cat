import type { APIRoute } from "astro";
import { prisma } from "@/lib/db";
import { setSessionCookie, signSessionToken } from "@/lib/auth";
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

	const { username, passkey } = parsed.data;
	const user = await prisma().user.findFirst({
		where: { username },
	});
	if (!user || !verifyPasskey(passkey, user.passkey)) {
		return Response.json({ error: "invalid_credentials" }, { status: 401 });
	}

	const token = await signSessionToken({
		id: user.id,
		username: user.username,
		role: user.role as "client" | "worker" | "admin",
	});
	setSessionCookie(cookies, token);
	return Response.json({ user: publicUser(user) });
};
