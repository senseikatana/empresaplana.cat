import type { APIRoute } from "astro";
import { clearSessionCookie } from "@/lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	const { auth } = await import("@/config/auth.config");
	const headers = new Headers(request.headers);
	headers.delete("content-length");
	headers.set("content-type", "application/json");
	const authResponse = await auth.handler(
		new Request(new URL("/api/auth/sign-out", request.url), {
			method: "POST",
			headers,
			body: "{}",
		}),
	);
	clearSessionCookie(cookies);
	if (!authResponse.ok) return authResponse;

	const responseHeaders = new Headers(authResponse.headers);
	responseHeaders.delete("content-length");
	return Response.json({ ok: true }, { headers: responseHeaders });
};
