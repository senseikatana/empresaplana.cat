import type { APIRoute } from "astro";
import { clearNativeSession, nativeAuthActions } from "@/lib/insforge-auth";
import { authFailure } from "@/lib/auth-request";
export const prerender = false;
export const POST: APIRoute = async ({ request, cookies }) => {
	const origin = request.headers.get("Origin");
	if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "forbidden" }, { status: 403 });
	const { error } = await nativeAuthActions(cookies).signOut();
	clearNativeSession(cookies);
	if (error) return authFailure(error);
	return Response.json({ ok: true });
};
