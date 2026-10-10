import type { APIRoute } from "astro";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatValidationError } from "@/lib/validation/users";

export const prerender = false;

const budgetSchema = z.object({
	clientName: z.string().trim().min(1, "Nombre requerido").max(200),
	email: z
		.email("Email inválido")
		.max(200)
		.transform((v) => v.toLowerCase()),
	phone: z.string().trim().regex(/^\+?[0-9\s-]{6,20}$/, "Teléfono inválido"),
	company: z.string().trim().max(200).optional(),
	reasonId: z.string().min(1, "Motivo requerido").max(60),
	description: z.string().max(2000).optional(),
	departureCity: z.string().trim().max(120).optional(),
	departureDay: z.string().max(12).optional(),
	departureTime: z.string().max(10).optional(),
	arrivalCity: z.string().trim().max(120).optional(),
	arrivalDay: z.string().max(12).optional(),
	arrivalTime: z.string().max(10).optional(),
	people: z.string().max(10).optional(),
});

// Simple in-memory rate limit: max 5 budgets per user per 10 minutes
const rateLimitMap = new Map<number, number[]>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(userId: number): boolean {
	const now = Date.now();
	const timestamps = rateLimitMap.get(userId) ?? [];
	const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
	if (valid.length >= RATE_LIMIT_MAX) return false;
	valid.push(now);
	rateLimitMap.set(userId, valid);
	return true;
}

// ── POST /api/budget ────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request, cookies }) => {
	const session = await getSession(cookies);
	if (!session) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}

	if (!checkRateLimit(session.id)) {
		return Response.json(
			{ error: "rate_limit_exceeded", retryIn: "10 minutes" },
			{ status: 429 },
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "invalid_body" }, { status: 400 });
	}

	const parsed = budgetSchema.safeParse(body);
	if (!parsed.success) {
		return Response.json(formatValidationError(parsed.error), { status: 400 });
	}

	const data = parsed.data;
	const id = crypto.randomUUID().replace(/-/g, "").slice(0, 20);

	const budget = await prisma().budget.create({
		data: {
			id,
			userId: session.id,
			clientName: data.clientName,
			email: data.email,
			phone: data.phone,
			company: data.company ?? null,
			reasonId: data.reasonId,
			description: data.description ?? null,
			departureCity: data.departureCity ?? "",
			departureDay: data.departureDay ?? "",
			departureTime: data.departureTime ?? "",
			arrivalCity: data.arrivalCity ?? "",
			arrivalDay: data.arrivalDay ?? "",
			arrivalTime: data.arrivalTime ?? "",
			people: data.people ?? "",
			status: "received",
		},
	});

	return Response.json({ id: budget.id, status: budget.status }, { status: 201 });
};
