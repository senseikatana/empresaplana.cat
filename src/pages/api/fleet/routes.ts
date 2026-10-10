import type { APIRoute } from "astro";
import { authorize } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const prerender = false;

// ── GET /api/fleet/routes ───────────────────────────────────────────────────
export const GET: APIRoute = async ({ cookies }) => {
	const { response } = await authorize(cookies);
	if (response) return response;

	const routes = await prisma().route.findMany({
		orderBy: { code: "asc" },
	});

	return Response.json({ routes });
};
