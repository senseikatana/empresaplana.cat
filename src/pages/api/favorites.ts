import type { APIRoute } from "astro";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatValidationError } from "@/lib/validation/users";

export const prerender = false;

const toggleSchema = z.object({
	routeId: z.string().min(1, "routeId requerido").max(40),
});

// ── GET /api/favorites ──────────────────────────────────────────────────────
export const GET: APIRoute = async ({ cookies }) => {
	const session = await getSession(cookies);
	if (!session) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}

	const favorites = await prisma().favoriteRoute.findMany({
		where: { userId: session.id },
		orderBy: { createdAt: "desc" },
	});

	if (favorites.length === 0) {
		return Response.json({ favorites: [] });
	}

	const routeIds = favorites.map((f) => f.routeId);
	const routes = await prisma().route.findMany({
		where: { id: { in: routeIds } },
	});

	return Response.json({ favorites: routes });
};

// ── PUT /api/favorites ──────────────────────────────────────────────────────
export const PUT: APIRoute = async ({ request, cookies }) => {
	const session = await getSession(cookies);
	if (!session) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "invalid_body" }, { status: 400 });
	}

	const parsed = toggleSchema.safeParse(body);
	if (!parsed.success) {
		return Response.json(formatValidationError(parsed.error), { status: 400 });
	}

	const { routeId } = parsed.data;

	const existing = await prisma().favoriteRoute.findUnique({
		where: { userId_routeId: { userId: session.id, routeId } },
	});

	if (existing) {
		await prisma().favoriteRoute.delete({
			where: { id: existing.id },
		});
		return Response.json({ favorite: false });
	}

	await prisma().favoriteRoute.create({
		data: { userId: session.id, routeId },
	});
	return Response.json({ favorite: true });
};
