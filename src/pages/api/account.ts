import type { APIRoute } from "astro";
import { z } from "zod";
import { authorize } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPasskey, verifyPasskey } from "@/lib/passkey";
import { publicUser } from "@/lib/users";
import { formatValidationError } from "@/lib/validation/users";

export const prerender = false;

const updateAccountSchema = z.object({
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
		.regex(/^\+?[0-9\s-]{6,20}$/, "Teléfono inválido")
		.optional(),
	email: z
		.email("Email inválido")
		.max(254, "Email demasiado largo")
		.transform((v) => v.toLowerCase())
		.optional(),
	newPassword: z
		.string()
		.regex(
			/^[A-Za-z0-9]{8}$/,
			"El passkey debe tener 8 caracteres alfanuméricos",
		)
		.optional(),
	currentPasskey: z.string().min(1, "Passkey actual requerido").optional(),
});

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

	// Sensitive fields require currentPasskey
	const changingEmail = data.email !== undefined;
	const changingPassword = data.newPassword !== undefined;

	if (changingEmail || changingPassword) {
		if (!data.currentPasskey) {
			return Response.json(
				{ error: "current_passkey_required" },
				{ status: 400 },
			);
		}
		const existing = await prisma().user.findUnique({
			where: { id: user.id },
			select: { passkey: true },
		});
		if (!existing || !verifyPasskey(data.currentPasskey, existing.passkey)) {
			return Response.json(
				{ error: "invalid_passkey" },
				{ status: 401 },
			);
		}
	}

	// Check email uniqueness
	if (data.email) {
		const clash = await prisma().user.findFirst({
			where: { email: data.email, NOT: { id: user.id } },
		});
		if (clash) {
			return Response.json(
				{ error: "conflict", field: "email" },
				{ status: 409 },
			);
		}
	}

	const updateData: Record<string, unknown> = {};
	if (data.name !== undefined) updateData.name = data.name;
	if (data.fullName !== undefined) updateData.fullName = data.fullName;
	if (data.phone !== undefined) updateData.phone = data.phone;
	if (data.email !== undefined) updateData.email = data.email;
	if (data.newPassword !== undefined) {
		updateData.passkey = hashPasskey(data.newPassword);
	}

	if (Object.keys(updateData).length === 0) {
		return Response.json({ error: "nothing_to_update" }, { status: 400 });
	}

	const updated = await prisma().user.update({
		where: { id: user.id },
		data: updateData,
	});

	return Response.json({ user: publicUser(updated) });
};
