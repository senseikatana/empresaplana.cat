import type { APIRoute } from "astro";
import type { UsuarioRole } from "@/interfaces/auth";
import { authorize } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPasskey } from "@/lib/passkey";
import { publicUser } from "@/lib/users";
import {
	createUserSchema,
	formatValidationError,
} from "@/lib/validation/users";

const USUARIO_ROLES = ["client", "worker", "admin"] as const;

export const prerender = false;

export const GET: APIRoute = async ({ cookies, url }) => {
	const { response } = await authorize(cookies, "admin");
	if (response) return response;

	const roleParam = url.searchParams.get("role");
	const role = USUARIO_ROLES.includes(roleParam as UsuarioRole)
		? (roleParam as UsuarioRole)
		: undefined;

	const rows = role
		? await prisma().user.findMany({ where: { role } })
		: await prisma().user.findMany();
	return Response.json({ users: rows.map(publicUser) });
};

export const POST: APIRoute = async ({ request, cookies }) => {
	const { response } = await authorize(cookies, "admin");
	if (response) return response;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "invalid_body" }, { status: 400 });
	}

	const parsed = createUserSchema.safeParse(body);
	if (!parsed.success) {
		return Response.json(formatValidationError(parsed.error), { status: 400 });
	}
	const data = parsed.data;

	const existingEmail = await prisma().user.findUnique({
		where: { email: data.email },
	});
	if (existingEmail) {
		return Response.json(
			{ error: "conflict", field: "email" },
			{ status: 409 },
		);
	}

	const existingUsername = await prisma().user.findUnique({
		where: { username: data.username },
	});
	if (existingUsername) {
		return Response.json(
			{ error: "conflict", field: "username" },
			{ status: 409 },
		);
	}

	const created = await prisma().user.create({
		data: {
			name: data.name,
			fullName: data.fullName,
			phone: data.phone,
			email: data.email,
			passkey: hashPasskey(data.passkey),
			username: data.username,
			role: data.role,
		},
	});

	return Response.json({ user: publicUser(created) }, { status: 201 });
};
