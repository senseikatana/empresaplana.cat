import type { APIRoute } from "astro";
import { z } from "zod";
import { authorize } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/users";
import { formatValidationError } from "@/lib/validation/users";

export const prerender = false;

const updateAccountSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, "Nombre obligatorio")
			.max(60, "Máximo 60 caracteres")
			.optional(),
		fullName: z
			.string()
			.trim()
			.min(1, "Nombre completo obligatorio")
			.max(120, "Máximo 120 caracteres")
			.optional(),
		phone: z
			.string()
			.trim()
			.regex(/^$|^\+?[0-9\s-]{6,20}$/, "Teléfono inválido")
			.optional(),
	})
	.strict();

// ── GET /api/account ────────────────────────────────────────────────────────
export const GET: APIRoute = async ({ cookies }) => {
	const { user, response } = await authorize(cookies);
	if (response) return response;

	const row = await prisma().user.findUnique({
		where: { id: user.id },
	});
	if (!row) {
		return Response.json({ error: "not_found" }, { status: 404 });
	}

	return Response.json({ user: publicUser(row) });
};

// ── PATCH /api/account ──────────────────────────────────────────────────────
export const PATCH: APIRoute = async ({ request, cookies }) => {
	const { user, response } = await authorize(cookies);
	if (response) return response;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "invalid_body" }, { status: 400 });
	}

	const parsed = updateAccountSchema.safeParse(body);
	if (!parsed.success) {
		return Response.json(formatValidationError(parsed.error), { status: 400 });
	}
	const data = parsed.data;

	const updateData: Record<string, unknown> = {};
	if (data.name !== undefined) updateData.name = data.name;
	if (data.fullName !== undefined) updateData.fullName = data.fullName;
	if (data.phone !== undefined) updateData.phone = data.phone;

	if (Object.keys(updateData).length === 0) {
		return Response.json({ error: "nothing_to_update" }, { status: 400 });
	}

	const updated = await prisma().user.update({
		where: { id: user.id },
		data: updateData,
	});

	return Response.json({ user: publicUser(updated) });
};
