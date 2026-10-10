import type { APIRoute } from "astro";
import { prisma } from "@/lib/db";
import { authorize, clearSessionCookie } from "@/lib/auth";
import { publicUser } from "@/lib/users";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
	const { user, response } = await authorize(cookies);
	if (response) return response;

	const row = await prisma().user.findUnique({
		where: { id: user.id },
	});
	if (!row) {
		clearSessionCookie(cookies);
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}

	return Response.json({ user: publicUser(row) });
};
