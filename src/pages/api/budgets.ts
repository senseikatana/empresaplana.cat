import type { APIRoute } from "astro";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const prerender = false;

// ── GET /api/budgets ────────────────────────────────────────────────────────
export const GET: APIRoute = async ({ cookies }) => {
	const session = await getSession(cookies);
	if (!session) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}

	const budgets = await prisma().budget.findMany({
		where: { userId: session.id },
		orderBy: { createdAt: "desc" },
	});

	return Response.json({ budgets });
};
