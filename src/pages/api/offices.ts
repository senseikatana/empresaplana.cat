import type { APIRoute } from "astro";
import { prisma } from "@/lib/db";

export const prerender = false;

// ── GET /api/offices ────────────────────────────────────────────────────────
export const GET: APIRoute = async () => {
	const offices = await prisma().office.findMany({
		orderBy: { order: "asc" },
	});

	return Response.json({ offices });
};
