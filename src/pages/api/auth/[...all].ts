import type { APIRoute } from "astro";

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
	const { auth } = await import("@/lib/better-auth");
	return auth.handler(request);
};
