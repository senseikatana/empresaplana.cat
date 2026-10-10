import type { APIRoute } from "astro";
import { authorize } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPasskey } from "@/lib/passkey";
import { publicUser } from "@/lib/users";
import {
	formatValidationError,
	updateUserSchema,
} from "@/lib/validation/users";

export const prerender = false;

function parseId(param: string | undefined): number | null {
	if (!param) return null;
	const id = Number(param);
	return Number.isInteger(id) && id > 0 ? id : null;
}

export const GET: APIRoute = async ({ params, cookies }) => {
	const { response } = await authorize(cookies, "admin");
	if (response) return response;

	const id = parseId(params.id);
	if (id === null)
		return Response.json({ error: "invalid_id" }, { status: 400 });

	const row = await prisma().user.findUnique({ where: { id } });
	if (!row) return Response.json({ error: "not_found" }, { status: 404 });

	return Response.json({ user: publicUser(row) });
};

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
	const { response } = await authorize(cookies, "admin");
	if (response) return response;

	const id = parseId(params.id);
	if (id === null)
		return Response.json({ error: "invalid_id" }, { status: 400 });

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "invalid_body" }, { status: 400 });
	}

	const parsed = updateUserSchema.safeParse(body);
	if (!parsed.success) {
		return Response.json(formatValidationError(parsed.error), { status: 400 });
	}
	const data = parsed.data;

	const existing = await prisma().user.findUnique({ where: { id } });
	if (!existing) return Response.json({ error: "not_found" }, { status: 404 });

	if (data.email) {
		const emailClash = await prisma().user.findFirst({
			where: { email: data.email, NOT: { id } },
		});
		if (emailClash) {
			return Response.json(
				{ error: "conflict", field: "email" },
				{ status: 409 },
			);
		}
	}
	if (data.username) {
		const usernameClash = await prisma().user.findFirst({
			where: { username: data.username, NOT: { id } },
		});
		if (usernameClash) {
			return Response.json(
				{ error: "conflict", field: "username" },
				{ status: 409 },
			);
		}
	}

	const updateData: Record<string, unknown> = {};
	if (data.name !== undefined) updateData.name = data.name;
	if (data.fullName !== undefined) updateData.fullName = data.fullName;
	if (data.phone !== undefined) updateData.phone = data.phone;
	if (data.email !== undefined) updateData.email = data.email;
	if (data.username !== undefined) updateData.username = data.username;
	if (data.role !== undefined) updateData.role = data.role;
	if (data.passkey !== undefined) updateData.passkey = hashPasskey(data.passkey);

	const updated = await prisma().user.update({
		where: { id },
		data: updateData,
	});

	return Response.json({ user: publicUser(updated) });
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
	const { user, response } = await authorize(cookies, "admin");
	if (response) return response;

	const id = parseId(params.id);
	if (id === null)
		return Response.json({ error: "invalid_id" }, { status: 400 });
	if (id === user.id)
		return Response.json({ error: "cannot_delete_self" }, { status: 400 });

	const row = await prisma().user.findUnique({ where: { id }, select: { id: true } });
	if (!row) return Response.json({ error: "not_found" }, { status: 404 });

	await prisma().user.delete({ where: { id } });
	return Response.json({ ok: true });
};
