import type { APIRoute } from "astro";

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
	const { auth } = await import("@/config/auth.config");
	return auth.handler(request);
};
