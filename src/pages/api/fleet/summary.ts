import type { APIRoute } from "astro";
import { authorize } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const prerender = false;

// ── GET /api/fleet/summary ──────────────────────────────────────────────────
export const GET: APIRoute = async ({ cookies }) => {
	const { response } = await authorize(cookies);
	if (response) return response;

	const [routes, buses, stops, schedules, drivers] = await Promise.all([
		prisma().route.count(),
		prisma().bus.count(),
		prisma().stop.count(),
		prisma().schedule.count(),
		prisma().driver.count(),
	]);

	return Response.json({
		routes,
		buses,
		stops,
		schedules,
		drivers,
	});
};
