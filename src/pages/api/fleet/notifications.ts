import type { APIRoute } from "astro";
import { authorize } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const prerender = false;

// ── GET /api/fleet/notifications ────────────────────────────────────────────
export const GET: APIRoute = async ({ cookies }) => {
	const { response } = await authorize(cookies);
	if (response) return response;

	const notifications = await prisma().notification.findMany({
		take: 50,
		orderBy: { createdAt: "desc" },
	});

	return Response.json({ notifications });
};
