import { refreshAuth } from "@insforge/sdk/ssr";
import type { APIRoute } from "astro";
import { insforgeConfig } from "@/lib/insforge-auth";
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
	if (
		request.headers.get("Origin") &&
		request.headers.get("Origin") !== new URL(request.url).origin
	)
		return Response.json({ error: "forbidden" }, { status: 403 });
	const result = await refreshAuth({ ...insforgeConfig(), request });
	return result.response;
};
