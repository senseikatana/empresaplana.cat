import type { APIRoute } from "astro";
import { prisma } from "@/lib/db";

export const prerender = false;

// ── GET /api/health ─────────────────────────────────────────────────────────
export const GET: APIRoute = async () => {
	try {
		await prisma().$queryRaw`SELECT 1`;
		return Response.json({ ok: true, db: "up" });
	} catch (err) {
		return Response.json(
			{ ok: false, db: "down", error: String(err) },
			{ status: 503 },
		);
	}
};
